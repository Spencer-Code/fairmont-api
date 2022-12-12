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
            if (isValid){
                return db('users').select('*').where('email', req.body.email)
                .then(user =>{
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
        if(user.length){
            res.json(user[0]);
        } else {
            res.status(400).json('not found')
        }
    }).catch(err => res.status(400).json('error getting user'));
});

app.get("/users", (req, res) =>{
    db.select('*').from('users')
        .then(users => {
            res.json(users);
        }).catch(err => res.status(400).json('error getting users'));
});

app.post("/updateUser", (req, res) => {
    //Usual destructuring wasn't working. Used the long winded way.
    const userId = req.body.id;
    const fName = req.body.first_name;
    const lName= req.body.last_name;
    const newEmail = req.body.email;
    const oldEmail = req.body.old_email;
    const userPermission = req.body.permission; 

    db('users')
        .where({id : userId})
        .update({
            first_name: fName,
            last_name: lName,
            email: newEmail,
            permission: userPermission
        }).then(()=>{
            return db('login')
                .where({email : oldEmail})
                .update({email: newEmail})
        }).then(() => {
            res.json({result: 'success'});
        }).catch(error => 
            { res.json(error) 
        });
});

app.post("/deleteUser", async (req, res) => {
    const reqEmail = req.body.email;

    try{
        await db('login').where({ email: reqEmail}).del()
        await db('users').where({ email: reqEmail}).del()
        res.json('deleted')
    } catch(e){
        res.json('cannot delete')
    }
})

app.post("/newsletter", (req, res) =>{
    const emailInput = req.body.email;
    db('newsletter').insert({email: emailInput})
    .then(() => {
        res.json('success') 
    })
    .catch(error => 
        { res.json('success') 
    });
});

app.get("/newsletterJson", async (req, res) =>{
    const emails = await db('newsletter').select('email');
    const userEmails = await db('users').select('email');
    let combined = [].concat(emails, userEmails);
    combined = [... new Set(combined.map(JSON.stringify))].map(JSON.parse)
    res.json(combined);

});

app.get("/supportLinks", (req, res) =>{
    db.select('*').from('support_links')
        .then(links => {
            res.json(links);
        }).catch(err => res.status(400).json('error getting users'));
});

app.post("/updateSupportLink", (req, res) => {
    //Usual destructuring wasn't working. Used the long winded way.
    const linkId = req.body.id;
    const siteName = req.body.site_name;
    const siteUrl= req.body.url;

    db('support_links')
        .where({id : linkId})
        .update({
            site_name : siteName,
            url: siteUrl
        }).then(() => {
            res.json({result: 'success'});
        }).catch(error => 
            { res.json({result: 'error'}) 
        });
});

app.post("/deleteSupportLink", async (req, res) => {
    const reqId = req.body.id;

    try{
        await db('support_links').where({ id: reqId}).del()
        res.json('deleted')
    } catch(e){
        res.json('cannot delete support link')
    }
})

app.post("/insertSupportLink", async (req, res) => {
    const siteName = req.body.site_name;
    const siteUrl = req.body.url;
    
    try{
        await db('support_links').insert({
            site_name: siteName,
            url : siteUrl
        })
        res.json('inserted')
    } catch(e){
        res.json('cannot insert support link')
    }
})

app.post("/chatroom", (req, res) =>{
    const {email, message} = req.body;

    db('message').insert({
        email: email,
        message: message
    })
    .then(response => {
        res.json(response)    
    
    }).catch(error => res.status(400).json(error));
});

app.get("/chatmessagepull", (req, res) =>{
    db.select('*').from('message')
    .then(message => {
        console.log(message);
        res.json(message)
    }).catch(err => res.status(400).json('error getting message'));
});
app.listen(5001, () => {
    console.log("Server Started 5001");
});