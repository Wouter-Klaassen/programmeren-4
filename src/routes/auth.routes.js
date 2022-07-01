const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authentication.controller');

//########## Authentication ###############

router.post('/auth/login', AuthController.validateLogin, AuthController.login);

module.exports = router;