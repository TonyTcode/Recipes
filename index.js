const express = require('express');
const app = express();
const mustacheExpress = require('mustache-express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;
const session = require('express-session');
app.engine('mustache', mustacheExpress());

app.set('views', './views');
app.set('view engine', 'mustache');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));

app.use(
  session({
    secret: 'randocharherethere',
    resave: false,
    saveUninitialized: false
  })
);

var pgp = require('pg-promise')();
var connectionString = 'postgres://localhost:5432/blogsdb';
var db = pgp(connectionString);

// ROOT DIRECTORY
app.get('/', (req, res) => {
  res.render('index');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', (req, res) => {
  let username = req.body.username;
  let password = req.body.password;

  db.oneOrNone('SELECT userid,username,password FROM users WHERE username=$1', [
    username
  ]).then(user => {
    if (user) {
      bcrypt.compare(password, user.password, function(error, result) {
        if (result) {
          if (req.session) {
            req.session.user = { userid: user.userid, username: user.username };
          }
          res.redirect('/users/blogs');
        } else {
          res.render('login', { message: 'Invalid username or password!' });
        }
      });
    } else {
      res.render('login', { message: 'Invalid username or password' });
    }
  });
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', (req, res) => {
  let username = req.body.username;
  let password = req.body.password;

  try {
    db.oneOrNone('SELECT userid FROM users WHERE username=$1', [username]).then(
      user => {
        if (user) {
          res.render('register', { message: 'Username already exists!' });
        } else {
          bcrypt.hash(password, SALT_ROUNDS, function(error, hash) {
            if (error == null) {
              db.none('INSERT INTO users(username, password) VALUES($1,$2)', [
                username,
                hash
              ]).then(() => {
                res.render('login');
              });
            }
          });
        }
      }
    );
  } catch (err) {
    console.log(err);
  }
});

port = 5000;
app.listen(port, () => {
  console.log(`Recipe Social App is running on port ${port}`);
});
