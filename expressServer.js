var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080
var cookieParser = require('cookie-parser');

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
                  }
};

app.use(cookieParser());
app.set("view engine", "ejs");


const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));


function generateRandomString(length){
  let randomString = [];
  let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for(let a = 0; a < length; a += 1){
    var randomNumber = Math.floor(Math.random() * possible.length);
    console.log(randomNumber);
    randomString.push(possible[randomNumber]);
  }

  let returnString = randomString.join('');
  return returnString;
}


console.log(generateRandomString(6));

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.end("Hello!");
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
  console.log(req.cookies);

  let templateVars = {
                       urls: urlDatabase,
                       username: req.cookies["username"],
                       users: users
                     };

  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {

  let templateVars =  {
                        username: req.cookies["username"],
                        users: users
                      };

  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {

  let templateVars =  {
                        shortUrls: req.params.id,
                        fullUrl: urlDatabase[req.params.id],
                        username: req.cookies["username"],
                        users: users
                      };

  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  console.log(req.body);
  urlDatabase[generateRandomString(6)] = req.body.longURL;
  console.log(urlDatabase);
  res.send("Posted new url " + req.body.longURL);         // Respond with 'Ok' (we will replace this)
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  console.log(urlDatabase);
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {
  console.log('Hey!!')
  urlDatabase[req.params.id] = req.body.longURL;

  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  var something = req.body.username;
  res.cookie('username', something);
  console.log(something);
  res.redirect("/urls")

});

app.get("/logout", (req, res) => {
  res.clearCookie('username');
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
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


  res.cookie('username', userID);
  users[userID] = {
    id: userID,
    email: req.body.email,
    password: req.body.password
  };
  console.log(users);
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  let templateVars =  {
                        username: req.cookies["username"],
                        users: users
                      };

  res.render("login", templateVars)
});




