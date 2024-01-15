const crypto = require('crypto')
require('dotenv').config()

const config = {
    db: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        pass: process.env.DB_PASS
    },
    jwtSecret: crypto.createSecretKey(process.env.JWT_SECRET),
    timeout: 60 * 60 * 1000, // 60' measured in ms
}

module.exports = config;
