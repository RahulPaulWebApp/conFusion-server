var express = require('express');
const bodyParser = require('body-parser');
var User = require('../models/user');
var passport = require('passport');
var router = express.Router();
var authenticate = require('../authenticate');


router.use(bodyParser.json());

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/signup', function(req, res, next){
  User.register(new User({username: req.body.username}), 
    req.body.password,(err, user) =>{

    if(err){
            res.status(500);
            res.setHeader('Content-type', 'application/json');
            res.json({err: err});
    } else {
            passport.authenticate('local')(req, res, ()=>{
                  res.status(200).json({success: true, status: 'Registration Successful!'})
                  res.setHeader('Content-Type', 'application/json');
            })
      }
    }
  );
})

router.post('/signup', (req, res, next) => {
  User.findOne({username: req.body.username})
  .then((user) => {
    if(user != null) {
      var err = new Error('User ' + req.body.username + ' already exists!');
      err.status = 403;
      next(err);
    }
    else {
      return User.create({
        username: req.body.username,
        password: req.body.password});
    }
  })
  .then((user) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json({status: 'Registration Successful!', user: user});
  }, (err) => next(err))
  .catch((err) => next(err));
});

router.post('/login', passport.authenticate('local'), (req, res) => {

  var token = authenticate.getToken({_id: req.user._id});
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.json({success: true, token: token, status: 'You are successfully logged in!'});
});

router.get('/logout', (req, res)=> {
  if (req.session) {
    req.session.destroy();
    res.clearCookie('session-id');
    res.redirect('/');
  }
  else {
    var err = new Error(' You are not logged in!');
    err.status = 403;
    next(err);
  }
})

module.exports = router;
