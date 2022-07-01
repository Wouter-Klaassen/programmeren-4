require('dotenv').config()

const jwt = (module.exports = {
    secretKey: process.env.JWT_SECRET
});