const Strategy = require('passport-jwt').Strategy, ExtractJwt = require('passport-jwt').ExtractJwt
const passport = require('passport')
const Users = require('./db')
const cfg = require('./config')

const opts = {}
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken()
opts.secretOrKey = cfg.jwtSecret

passport.use(
    new Strategy(opts, (payload, done) => {
        Users.findOne({public_key: payload.public_key, roles: payload.roles}).then(user => {
            return user ? done(null, user) : done(null, false)
        }).catch(console.log)
    })
)


module.exports = passport
