const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authController = require('../controllers/auth.controller');

//########## Users ###############

//Register user 
//authController.validateToken,
router.post("/user", authController.validateToken, userController.validateUser, userController.addUser);

//Get all users
router.get("/user", authController.validateToken, userController.getAllUsers);

//Request current user profile
router.get("/user/profile", authController.validateToken, userController.getUserProfile)

//Get user by id
router.get("/user/:id", authController.validateToken, userController.validateId, userController.getUserById)

//Update user
router.put("/user/:id", authController.validateToken, userController.validateId, userController.validateUser, userController.updateUser);

//Delete user
router.delete("/user/:id", authController.validateToken, userController.validateId, userController.deleteUser);

module.exports = router;