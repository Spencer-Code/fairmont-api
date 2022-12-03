const express = require("express");
const mysql = require("mysql");                 
const dotenv = require("dotenv");               //Lets .env be used
const bodyParser = require('body-parser');      //Allows for parasing of req body in API calls
const bcrypt = require('bcrypt-nodejs');        //Allows for Password Encription
const cors = require('cors');                   //Allows for localhost fetching from frontend appilcaiton server
const knex = require('knex');                   //Allows for easy database access

dotenv.config();

const app = express();
app.use(bodyParser.json())
app.use(cors())

const db = knex({
    client: 'mysql',
    connection: {
      host : '127.0.0.1',
      port : 3306,
      user : process.env.DATABASE_USER,
      password : process.env.DATABASE_PASSWORD,
      database : process.env.DATABASE
    }
  });

app.get("/", (req, res) =>{
   // empty for testing
});

app.post("/register", (req, res) =>{
    const {fName, lName, email, password} = req.body;
    const hash = bcrypt.hashSync(password);
    console.log(hash)
    db('login').insert({
        hashed_password: hash,
        email: email
    }).then( 
        db('users')
            .insert({
                first_name: fName,
                last_name: lName,
                email: email
            })
            .then(response => {
                db('users').where({id: response}).then(user => {res.json(user[0])})
            })
    ).catch(error => res.status(400).json('unable to register'));
});

app.post("/login", (req, res) =>{
    db('login')
        .select('email', 'hashed_password')
        .where('email', req.body.email)
        .then(data =>{
            const isValid = bcrypt.compareSync(req.body.password, data[0].hashed_password);
            console.log(isValid)
            if (isValid){
                return db('users').select('*').where('email', req.body.email)
                .then(user =>{
                    console.log(user[0])
                    res.json(user[0])
                })
                // .catch(err = res.status(400).json('unable to get user'))
            } else {
                res.status(400).json('wrong username or password');
            }
        }).catch(err => res.status(400).json('wrong username or password'))
});

app.get("/profile/:id", (req, res) => {
    const { id } = req.params;
    db.select('*').from('users').where({
        id: id
    }).then(user => {
        console.log(user);
        if(user.length){
            res.json(user[0]);
        } else {
            res.status(400).json('not found')
        }
    }).catch(err => res.status(400).json('error getting user'));
});

app.listen(5001, () => {
    console.log("Server Started 5001");
});



// // Load hash from your password DB.
// bcrypt.compare("bacon", hash, function(err, res) {
//     // res == true
// });
// bcrypt.compare("veggies", hash, function(err, res) {
//     // res = false
// });