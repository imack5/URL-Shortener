var express = require("express");
var app = express();
var PORT = process.env.PORT || 5000; // default port 3000
var cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
var cookieSession = require('cookie-session');
var methodOverride = require('method-override');

app.use(methodOverride('_method'));


app.use(methodOverride('X-HTTP-Method-Override'))

app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

//Generates a random string with the characteristics [a-z][A-Z][1-9]
function generateRandomString(length){
  let randomStringArr = [];
  let possibleChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for(let a = 0; a < length; a += 1){
    var randomNumber = Math.floor(Math.random() * possibleChars.length);
    randomStringArr.push(possibleChars[randomNumber]);
  }

  let randomString = randomStringArr.join('');
  return randomString;
}

//returns urls owned by a specified user
function urlsForUserID(userID){
  let urlsForUser = {};

  for(let shortURL in urlDatabase){
    if(urlDatabase[shortURL].id == userID){
      urlsForUser[shortURL] = urlDatabase[shortURL];
    }
  }
  return urlsForUser;
}

//Database of users
const users = {

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

//Data base of urls
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

//Home page directs to either /urls if logged in, if not to a login page
app.get("/", (req, res) => {
  req.session.user_id == undefined ? res.redirect('/login') : res.redirect('/urls');
});

//Essentially the home page for site
app.get("/urls", (req, res) => {

  //If not logged in, redirect to login/register prompt
  if(req.session.user_id == undefined){
    res.render('login_prompt');
    return;
  }

  //Vars to pass into the /views/..
  let templateVars = {
                       urls: urlsForUserID(users[req.session.user_id].email),
                       user_ID: req.session.user_id,
                       users: users
                     };

  res.render("urls_index", templateVars);
});

//
app.get("/urls/new", (req, res) => {

  //Redirects to login page if not logged in
  if(!req.session.user_id){
    res.redirect('/login');
  }

  //Vars to pass into the /views/..
  let templateVars =  {
                        user_ID: req.session.user_id,
                        users: users
                      };

  res.render("urls_new", templateVars);
});

//Displays update page for the chosen mini url
app.get("/urls/:id", (req, res) => {

  //Redirects if mini url doesn't exist
  if(urlDatabase[req.params.id] === undefined){
    res.send('This short URL doesnt exist');
  }

  //Vars to pass into the /views/..
  let templateVars =  {
                        shortUrls: req.params.id,
                        fullUrl: urlDatabase[req.params.id].url,
                        user_ID: req.session.user_id,
                        users: users
                      };

  //If user not logged in, redirect to login
  if(req.session.user_id == undefined){
    res.render('login_prompt');
  }

  //verifies the ownership of the shortURL
  if(urlDatabase[req.params.id].id == users[req.session.user_id].email){
    res.render("urls_show", templateVars);
  } else {
    res.render('owner_warning');
  }
});

//Generates new shortURL
app.post("/urls", (req, res) => {

  let randomString = generateRandomString(6);

  urlDatabase[randomString] = {
                                url: req.body.longURL,
                                id: users[req.session.user_id].email
                              };

  res.redirect(`urls/${randomString}`)
});

//Navigates to shortURL's corresponding longURL
app.get("/u/:shortURL", (req, res) => {

  if(urlDatabase[req.params.id] === undefined){
    res.send('This short URL doesnt exist');
  }

  let longURL = urlDatabase[req.params.shortURL].url;
  res.redirect(longURL);
});

//Deletes shortURL
app.delete("/urls/:id/delete", (req, res) => {

  //Verifies ownership
  if(urlDatabase[req.params.id].id == users[req.session.user_id].email){
    res.redirect("/urls");
    delete urlDatabase[req.params.id];
  }
  res.redirect("/urls");
});

//updates longUrl of specified shortURL
app.put("/urls/:id", (req, res) => {
  urlDatabase[req.params.id].url = req.body.longURL;
  res.redirect("/urls");
});

//logs in corresponding user
app.put("/login", (req, res) => {
  let emailCheck = false;

  //iterates through users in the database
  for(let userID in users){

    //Checks email
    if(users[userID].email == req.body.email){
      emailCheck = true;

      //If email exists, check password match
      if(bcrypt.compareSync(req.body.password, users[userID].password)){
        req.session.user_id = userID;
      } else {
        res.status(403).send('Passwords dont match!');
      }
    }
  }

  //If email does not match any, return error.
  if(!emailCheck){ res.status(400).send('No Email in the system');}
  res.redirect("/urls");

});

//Logout and clears cookies
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

  //checks validity of entered email and password
  if(req.body.email == '' || req.body.password == ''){
    res.status(400).send('You must complete the email and password forms fully');
  }

  //verifies no duplicate users
  for(let a in users){
    if(users[a].email == req.body.email){
      res.status(400).send('Email already registered');
    }
  }

  //sets login status of newly verified user
  req.session.user_id = userID;

  //creates user
  users[userID] = {
                    id: userID,
                    email: req.body.email,
                    password: bcrypt.hashSync(req.body.password, 10)
                  };

  res.redirect("/urls");
});

//Login page
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




