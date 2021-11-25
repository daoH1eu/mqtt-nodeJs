const express = require('express');
const session = require('express-session');
const path = require('path');
const { con } = require('./database');

const app = express();
const port = 6060;  

app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));

app.use(express.json());//parse data from body request
app.use(express.urlencoded({extended: true }));

app.use(express.static("public"));

app.engine('html', require('ejs').renderFile);//make the render engine accept html 
app.set('view engine', 'html');
app.set('views', path.join(__dirname, "/pages"));

app.listen(port, function(){
    console.log('Server started at: http://localhost:' + port);
})

function checkAuth(req, res, next) {
    if (!req.session.loggedin) {
        res.redirect('/log-in');
    } else {
        res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
        next();
    }
}

app.get('/', checkAuth, function(req,res){
    res.redirect('/pages/dashboard.html');
});

//Route parameter
app.get('/pages/:filename', checkAuth, function(req,res){
    res.render(req.params.filename);
});

app.get('/log-in', function(req, res){
    res.render("sign-in.html", {text : ""});
});

//handle form data
app.post('/log-in', function(req,res){
    let username = req.body.username;
    let password = req.body.password;
    let sqlQuery = "select * from accounts where username= '" + username + "' and passwords='" +password +"'";
    con.query(sqlQuery, function(err, result, fields){
        if(result.length > 0){
            req.session.loggedin = true;
            res.redirect('/');
        }else{
            res.render("sign-in.html", {text : "Incorrect Username and/or Password!"});
        }
        res.end();
    });
});

app.get('/log-out', function(req,res){
    req.session.destroy( function(err){
        if(err) throw err;
        res.redirect('/');
    });
});


