const express = require('express');
const app = express();
const server = app.listen("3000")
const io = require('socket.io')(server);
const bodyParser = require('body-parser');
const mysql = require('mysql'); 
const crypto = require('crypto');
const passwordHash = require('password-hash');
const session = require('express-session');
const passport = require('passport');
const flash = require('express-flash');
const methodOverride = require('method-override');

const connection = mysql.createConnection({
    host: "localhost",
  user: "root",
  password: "GucciGang_999"
})

connection.connect(err =>{
    console.log("connected");
})


const initializePassport = require('./passport-config')

initializePassport(
    passport, 
    (email, callback) =>{
        sql = `select * from marshallchat.user where email = '${email}'`
        connection.query(sql, (err, result)=>{
            if(err){
                console.log(err)
            }
            else{
                if(result.length > 0){
                    callback(result[0])
                }
                else{
                    callback(null)
                }
            }
        })
},

    (username, callback)=>{

        sql = `select * from marshallchat.user where username = '${username}'`
        connection.query(sql, (err, result)=>{
            if(err){
                console.log(err)
            }
            else{
                if(result.length > 0){
                    callback(result[0])
                }
                else{
                    callback(null)
                }
            }
        })
}

)


app.use(bodyParser.urlencoded({extended: false}));
app.use(session({secret: 'kbdadsoapnalcniodbvoaineouybeool', resave: false, saveUninitialized: false}));
app.use(express.static('public'));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');



app.get('/', (req,res)=>{
    res.render('index', {user: req.user});
});


app.get('/register', checkNotAuthenticated, (req,res)=>{
    res.render('register')
});

app.post('/register', (req,res)=>{
    const id = crypto.randomBytes(50).toString('hex');
    const username = req.body.username;
    const email = req.body.email;
    const password = passwordHash.generate(req.body.password);
    const sql = `INSERT INTO marshallchat.user VALUES ( "${id}" , "${username}" , "${email}" , "${password}" )`;
    connection.query(sql , err=>{
        if(err){
            console.log('FFS ERROR:'+ err);
        }
        else{
            return res.redirect('/');
        }
        
    });
})

app.get('/login', checkNotAuthenticated, (req,res)=>{
    res.render('login')
});

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
})
);

app.delete('/logout', (req,res)=>{
    req.logout();
    res.redirect('/');
})

app.get('/contacts',(req,res)=>{
    sql = `select username FROM marshallchat.user where marshallchat.user.username in (SELECT contactUser FROM marshallchat.contacts where ownerUser = "${req.session.username}")`;
    connection.query(sql, (err,result)=>{
        if(err){
            console.log("ERROR: "+ err);
        }
        else{
            console.log(result);
            res.render('contacts', {contacts: result});
        }
    })
});


app.get('/chat', checkAuthenticated, (req,res) =>{
    res.render('chat');
})

io.on('connection', socket =>{

    io.emit('connected msg', "User is connected");

    socket.on('chat message', msg =>{

        socket.broadcast.emit('chat message', msg);
        //io.emit('chat message', msg);
    })


    socket.on('disconnect', ()=>{

        io.emit('disconnect', "user Disconnected");
    });
});

function checkAuthenticated(req,res,next){
    if(req.isAuthenticated()){
        return next()
    }

    res.redirect('/login')
}



function checkNotAuthenticated(req,res,next){
    if(req.isAuthenticated()){
        return res.redirect('/')
    }
    next()
}