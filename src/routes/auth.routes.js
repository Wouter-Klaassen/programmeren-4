const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');

//########## Authentication ###############

router.post('/auth/login', AuthController.validateLogin, AuthController.login);

module.exports = router;