const User = require('../models/User');
const validator = require('../utils/validatorUtils');
const hash = require('pbkdf2-password')();


const register_get = (req, res) => {
    res.render('register', {err: ''});
}

const register_post = (req, res) => {
    let name = req.body.name;
    let email = req.body.email;
    let password = req.body.password;
    let password1 = req.body.password1;

    if(validator.detectMalicious(name) || validator.detectMalicious(email) ||
    validator.detectMalicious(password) || validator.detectMalicious(password1)){
        res.redirect('malicious');
    }

    User.findOne({email: email}, (err, user) => {
        if(err){
            console.log(err);
            res.status(500).redirect('register');
        } else{
            if(user) {
                res.render('register', {err: 'Email address already used.'});
            } else {
                if(!checkPasswordsMatch(password, password1)){
                    res.render('register', {err: 'Passwords don\'t match'})
                } else{
                    hash({password}, (err, password, salt, hash) => {
                        const newUser = new User({
                            name, 
                            email, 
                            password: hash,
                            salt: salt
                        });

                        newUser.save((err, user) => {
                            if(err){
                                console.log(err)
                                res.render('register', {err: 'Can not add user.'})
                            } else {
                                res.redirect('login');
                            }
                        })
                    })
                }
            }
        }



    })

}

const checkPasswordsMatch = (pass, pass1) => {
    return pass === pass1;
}

module.exports = {
    register_get,
    register_post
}