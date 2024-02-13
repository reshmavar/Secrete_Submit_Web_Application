//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')


// const bcrypt = require('bcrypt');
//const md5 = require('md5');
//const encrypt = require("mongoose-encryption");

// const salt = 10;

const app = express();


app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended : true
}));

app.use(session({
    secret : "our little secret .",
    resave : false,
    saveUninitialized : false
}));

app.use(passport.initialize());
app.use(passport.session());

console.log(process.env.API_KEY);

mongoose.connect("mongodb://127.0.0.1:27017/userDB", {useNewUrlParser : true});

const userSchema = new mongoose.Schema({
    email : String,
    password : String,
    googleId: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);


//userSchema.plugin(encrypt,{secret : process.env.SECRET, encryptedFields:["password"]});

const User = new mongoose.model("User",userSchema);

passport.use(User.createStrategy());
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

passport.serializeUser(function(User, done) {
    done(null, User);
  });
  
  passport.deserializeUser(function(User, done) {
    done(null, User);
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRETS,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/",function(req,res){
    res.render("home");
});

app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
  );

  app.get("/auth/google/secrets", 
  passport.authenticate("google", { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  });


app.get("/login",function(req,res){
    res.render("login");
});
app.get("/register",function(req,res){
    res.render("register");
});

app.get("/secrets", function(req,res){
    if(req.isAuthenticated()){
        res.render("secrets");
    }else {
        res.redirect("/login");
    }
});

app.get("/logout",function(req,res){
    req.logOut(function(err){
        if(err){
            console.log(err);
        }else {
            res.redirect("/");
        }
    });
    //res.redirect("/")
});

app.post("/register",function(req,res){
    // const email = 
    // const password = ;

    // bcrypt.hash(req.body.password,salt).then(function(hash){
    //     const newUser = new User({
    //         email : req.body.username,
    //         password : hash
    //     });
    
    //     newUser.save(newUser).then(function(result){
    //         if(result){
    //             res.render("secrets");
    //         }
    //     }).catch(function(err){
    //         console.log(err);
    //         res.send(err);
    //     })

    // });
    
    

    User.register({username : req.body.username},req.body.password,function(err,user){
        if(err){
            console.log(err);
            res.redirect("/login");
        } else {
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            })
        }
    })
});

app.post("/login",function(req,res){
    // const email = req.body.username;
    // //const password = req.body.password;

    // User.findOne({email : email}).then(function(result){
    //     if(result){

    //         bcrypt.compare(req.body.password,result.password).then(function(result){
    //             if(result == true){
    //                 res.render("secrets");
    //             }
    //         }).catch(function(err){
    //             res.send(err);
    //         })
    //     }
    // }).catch(function(err){
    //     res.send(err);
    // })

    const user = new User({
        username : req.body.username,
        password : req.body.password
    });

    req.login(user,function(err){
        if(err){
            console.log(err);
        }
        else {
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            })
        }
    })

    
});







app.listen("3000",function(req,res){
    console.log("Server run on 3000 port...");
});