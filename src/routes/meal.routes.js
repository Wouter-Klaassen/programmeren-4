const express = require('express');
const router = express.Router();

const mealController = require('../controllers/meal.controller');
const authController = require('../controllers/authentication.controller');

//########## Meals ###############

//Add a meal
router.post("/meal", authController.validateToken, mealController.validateMeal, mealController.addMeal);

//Get all meals
router.get("/meal", mealController.getAllMeals);

//Get meal by id
router.get("/meal/:id", mealController.validateId, mealController.getMealById);

//Update meal
router.put("/meal/:id", authController.validateToken, mealController.validateId, mealController.validateMeal, mealController.updateMeal);

//Delete meal
router.delete("/meal/:id", authController.validateToken, mealController.validateId, mealController.deleteMeal);

module.exports = router;