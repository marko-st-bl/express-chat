const hash = require('pbkdf2-password')();
const emailUtils = require('../utils/emailUtils');
const { X509Certificate } = require('crypto');
const fs = require('fs');
const speakeasy = require('speakeasy');
const validator = require('../utils/validatorUtils');

const User = require('../models/User')

const login_get = (req, res) => {
  res.render('login', { err: '' });
}

const login_post = (req, res, next) => {
  if (validator.detectMalicious(req.body.email) || validator.detectMalicious(req.body.password)) {
    res.redirect('malicious');
  } else {
    authenticate(req.body.email, req.body.password, async (err, user) => {
      if (user) {
        console.log('Authentication Part I - login credentials passed ✔');
        //console.log(req.socket.getPeerCertificate(true).raw.toString('base64'))
        const x509 = req.socket.getPeerX509Certificate();

        verifyCertificate(user, x509, async (err, user) => {
          if (user) {
            console.log('Authentication Part II - certificate verification passed ✔');
            // Send token on email
            let secret = speakeasy.generateSecret({ length: 20 });
            let r = await User.updateOne({ email: user.email }, { secret });
            emailUtils.sendEmail(user.email, generateToken(secret));
            req.session.regenerate(function () {
              // Store the user's primary key
              // in the session store to be retrieved,
              // or in this case the entire user object
              let { password, salt, ...rest } = user._doc;
              req.session.user = rest;
              req.session.validated = false;
              res.redirect('token');
            });
          } else {
            console.log(err);
            res.status(403).render('login', { err });
          }
        });
      } else {
        console.log(err);
        console.log('LOGIN FAILED')
        res.status(403).render('login', { err });
      }
    })
  }
}

const token_get = (req, res) => {
  res.render('token', { err: '' });
}

const token_post = (req, res) => {
  if (req.session.user) {
    User.findOne({ email: req.session.user.email }, (err, user) => {
      if (err) {
        console.log(err);
        res.sendStatus(500);
      }
      if (!user) {
        console.log("User not found");
        res.sendStatus(500);
      }
      let verified = speakeasy.totp.verify({
        secret: user.secret.base32,
        encoding: 'base32',
        token: req.body.token,
        window: 6
      });
      if (verified) {
        console.log('Authentication Part III - token verification passed ✔');
        req.session.regenerate(() => {
          req.session.verified = true;
          const { password, salt, secret, ...rest } = user._doc;
          req.session.user = rest;
          res.redirect('/');
        })
      } else {
        res.render('token', { err: new Error('Token not valid') });
      }
    })
  } else {
    res.redirect('login');
  }
}

const authenticate = (email, pass, fn) => {

  User.findOne({ email: email }, 'name email password salt', function (err, user) {
    if (err)
      console.log(err)

    if (!user)
      return fn(new Error('Cannot find user'));

    hash({ password: pass, salt: user.salt }, function (err, pass, salt, hash) {
      if (err)
        return fn(err);

      //console.log(`Exppected: ${user.password} GOT: ${hash}`)

      if (hash === user.password)
        return fn(null, user)

      fn(new Error('invalid password'));
    })
  })
}

const verifyCertificate = (user, x509, fn) => {
  if (x509) {
    
    if (!x509.checkEmail(user.email)) {
      return fn(new Error('Provided cert does not belong to user.'));
    }
    // console.log(clientCert.checkEmail(user.email));
    // console.log("Valid to: ", clientCert.validTo);
    return fn(null, user);
  } else {
    return fn(new Error('No certificate uploaded.'))
  }
}


const generateToken = (secret) => {
  const token = speakeasy.totp({ secret: secret.base32, encoding: 'base32' })
  console.log('TOKEN:', token)
  return token;
}

module.exports = {
  login_get,
  login_post,
  token_get,
  token_post
}