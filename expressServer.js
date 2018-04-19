var express = require("express");
var app = express();
var PORT = process.env.PORT || 3000; // default port 3000
var cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
var cookieSession = require('cookie-session')

app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

function generateRandomString(length){
  let randomString = [];
  let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for(let a = 0; a < length; a += 1){
    var randomNumber = Math.floor(Math.random() * possible.length);
    randomString.push(possible[randomNumber]);
  }

  let returnString = randomString.join('');
  return returnString;
}

function urlsForUserID(userID){
  let urlsForUser = {};
  for(let link in urlDatabase){
    console.log(urlDatabase[link].id, '==' ,userID, urlDatabase[link].id == userID)
    if(urlDatabase[link].id == userID){
      urlsForUser[link] = urlDatabase[link];
    }
  }
  return urlsForUser;
}


const users = {
  "userRandomID":
                  {
                    id: "userRandomID",
                    email: "user@example.com",
                    password: "purple-monkey-dinosaur"
                  },
 "user2RandomID":
                  {
                    id: "user2RandomID",
                    email: "user2@example.com",
                    password: "dishwasher-funk"
                  },
 "Iain":
                  {
                    id: "Iain",
                    email: "i_mack5@hotmail.com",
                    password: bcrypt.hashSync('hi', 10)
                  },

 "Tim":
                  {
                    id: "Tim",
                    email: "tim@hotmail.com",
                    password: bcrypt.hashSync('hi', 10)
                  }

};

var urlDatabase = {
  "b2xVn2":
            {
              url: "http://www.lighthouselabs.ca",
              id: "i_mack5@hotmail.com"
            },

  "9sm5xK":
            {
              url: "http://www.google.com",
              id: "tim@hotmail.com"
            }
};

app.get("/", (req, res) => {
  (req.session.user_id == undefined) ?   res.redirect('/login') : res.redirect('/urls')
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {

  if(req.session.user_id == undefined){
    res.render('login_prompt');
    return;
  }

  let templateVars = {
                       urls: urlsForUserID(users[req.session.user_id].email),
                       user_ID: req.session.user_id,
                       users: users
                     };

                     console.log(templateVars.user_ID)
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  if(!req.session.user_id){ res.redirect('/login');}
  let templateVars =  {
                        user_ID: req.session.user_id,
                        users: users
                      };

  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {

  if(urlDatabase[req.params.id] === undefined){
    res.send('This short URL doesnt exist');
  }
  let templateVars =  {
                        shortUrls: req.params.id,
                        fullUrl: urlDatabase[req.params.id].url,
                        user_ID: req.session.user_id,
                        users: users
                      };

  if(req.session.user_id == undefined){
    res.render('login_prompt');
  }

  if(urlDatabase[req.params.id].id == users[req.session.user_id].email){
    res.render("urls_show", templateVars);
  } else {
    res.render('login_warning');
  }
  console.log('3')
  //res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {

  let randomString = generateRandomString(6);
  urlDatabase[randomString] = {
                                url: req.body.longURL,
                                id: users[req.session.user_id].email
                              };

  console.log(urlDatabase);
  res.redirect(`urls/${randomString}`)
 // res.send("Posted new url " + req.body.longURL);         // Respond with 'Ok' (we will replace this)
});

app.get("/u/:shortURL", (req, res) => {

  if(urlDatabase[req.params.id] === undefined){
    res.send('This short URL doesnt exist');
  }

  let longURL = urlDatabase[req.params.shortURL].url;
  res.redirect(longURL);
});

app.post("/urls/:id/delete", (req, res) => {
  if(urlDatabase[req.params.id].id == users[req.session.user_id].email){
    res.redirect("/urls");
    delete urlDatabase[req.params.id];
  }
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {

  urlDatabase[req.params.id].url = req.body.longURL;
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  let emailCheck = false;

  for(let userID in users){
    if(users[userID].email == req.body.email){
      emailCheck = true;

      if(bcrypt.compareSync(req.body.password, users[userID].password)){
        req.session.user_id = userID;
      } else {
        res.status(403).send('Passwords dont match!');
      }
    }
  }
  if(!emailCheck){ res.status(400).send('No Email in the system');}
  res.redirect("/urls")

});

app.get("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  if(req.session.user_id !== undefined){
    res.redirect('/urls');
  }
  res.render("registration");
});

app.post("/register", (req, res) => {
  var userID = generateRandomString(6);

  if(req.body.email == '' || req.body.password == ''){
    res.status(400).send('You must complete the email and password forms fully');
  }

  for(let a in users){
    if(users[a].email == req.body.email){
      res.status(400).send('Email already registered');
    }
  }


  req.session.user_id = userID;

  console.log('password:', req.body.password)

  users[userID] = {
    id: userID,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 10)
  };

  console.log(users);
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  if(req.session.user_id !== undefined){
    res.redirect('/urls');
  }
  let templateVars =  {
                        user_ID: req.session.user_id,
                        users: users
                      };

  res.render("login", templateVars)
});




