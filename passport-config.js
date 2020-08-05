const LocalStrategy = require('passport-local').Strategy    
const passwordHash = require('password-hash')

function initialize(passport, getUserByEmail, getUserByUsername){
    const authenticateUser = (email, password, done) =>{

        getUserByEmail(email, user =>{ 

            if(user == null){
                return done(null, false, {message: "No user with that email"})
            }
            try{
                if(passwordHash.verify(password, user.password)){
                    return done(null, user)
                }else{
                    return done(null, false, {message: "Password incorrect"})
                }
            }catch (e){
                return done(e)
            }
        })
    }

    passport.use(new LocalStrategy({usernameField: 'email'}, authenticateUser))
    passport.serializeUser((user, done)=>{ done(null, user.username)})
    passport.deserializeUser((username, done)=>{
        getUserByUsername(username, user=>{
            return done(null, user)
        })
        
    })
}


module.exports = initialize