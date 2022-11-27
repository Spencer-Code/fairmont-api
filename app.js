const express = require("express");
const mysql = require("mysql");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

db.connect( (error) => {
    if(error){
        console.log(error)
    } else {
        console.log("MySQL Connected...");
    }
});

app.get("/", (req, res) =>{
   res.send("<h1>hi</h1>")
});

app.post("/register", (req, res) =>{
    // register
});

app.post("/login", (req, res) =>{
    // login
});

app.listen(5001, () => {
    console.log("Server Started 5001");
});