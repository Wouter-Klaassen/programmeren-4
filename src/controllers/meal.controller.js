require('dotenv').config();
const assert = require('assert');
const { off } = require('process');

const dbconnection = require('../database/dbconnection');
const logger = require('../config/tracer_config').logger;

let controller = {
    validateMeal: (req, res, next) => {
        let meal = req.body;
        let {name, description, isActive, isVega, isVegan, isToTakeHome, dateTime, maxAmountOfParticipants, price, imageUrl} = meal;
        try {
            //Check if each field has the correct type
            assert(typeof name === 'string', 'Name must be a string');
            assert(typeof description === 'string', 'Description must be a string');
            assert(typeof isActive === 'boolean', 'IsActive must be a boolean');
            assert(typeof isVega === 'boolean', 'isVega must be a boolean');
            assert(typeof isVegan === 'boolean', 'isVegan must be a boolean');
            assert(typeof isToTakeHome === 'boolean', 'isToTakeHome must be a boolean');
            assert(typeof dateTime === 'string', 'DateTime must be a string');
            assert(typeof maxAmountOfParticipants === 'number', 'MaxAmountOfParticipants must a number');
            assert(typeof price === 'number', 'Price must a number');
            assert(typeof imageUrl === 'string', 'ImageUrl must a string');

            next();
        } catch (err) {
            const error = {
                status: 400,
                message: err.message
            }

            logger.debug(error);
            next(error);
        }
    },
    validateId: (req, res, next) => {
        const userId = req.params.id;
        try {
            assert(Number.isInteger(parseInt(userId)), "Id must be a number");
            next();
        } catch (err) {
            const error = {
                status: 400,
                message: err.message
            }

            logger.debug(error);
            next(error);
        }
    },
    addMeal: (req, res) => {
        let meal = req.body;
        const cookId = req.userId
        dbconnection.getConnection(function(connError, conn) {
            //Not connected
            if (connError) {
                res.status(502).json({
                    status: 502,
                    result: "Couldn't connect to database"
                }); return;
            }

            //Other meal properties
            meal.cookId = cookId;
            
            //Insert the user object into the database
            conn.query(`INSERT INTO meal SET ?`, meal, function (dbError, result, fields) {
                // When done with the connection, release it.
                conn.release();

                // Handle error after the release.
                if(dbError) {
                    logger.error(dbError);
                    res.status(500).json({
                        status: 500,
                        result: "Error"
                    });
                }

                res.status(201).json({
                    status: 201,
                    result: {
                        id: result.insertId,
                        cookId: cookId,
                        ...meal
                    }
                });
            });
        });
    },
    getAllMeals: (req, res) => {
        dbconnection.getConnection(function(connError, conn) {
            //Not connected
            if (connError) {
                res.status(502).json({
                    status: 502,
                    result: "Couldn't connect to database"
                }); return;
            }
            
            conn.query('SELECT * FROM meal', function (dbError, results, fields) {
                // When done with the connection, release it.
                conn.release();
                
                // Handle error after the release.
                if (dbError) {
                    console.log(dbError);
                    res.status(500).json({
                        status: 500,
                        result: "Error"
                    }); return;
                }
                
                res.status(200).json({
                    status: 200,
                    result: results
                });
            });
        });
    },
    getMealById: (req, res) => {
        const mealId = req.params.id;
        dbconnection.getConnection(function(connError, conn) {
            //Not connected
            if (connError) {
                res.status(502).json({
                    status: 502,
                    result: "Couldn't connect to database"
                }); return;
            }
            
            conn.query('SELECT * FROM meal WHERE id = ' + mealId, function (dbError, results, fields) {
                // When done with the connection, release it.
                conn.release();
                
                // Handle error after the release.
                if (dbError) {
                    logger.error(dbError);
                    res.status(500).json({
                        status: 500,
                        result: "Error"
                    }); return;
                }
                
                const result = results[0];
                if(result) {
                    res.status(200).json({
                        status: 200,
                        result: result
                    });
                } else {
                    res.status(404).json({
                        status: 404,
                        message: "Meal does not exist"
                    });
                }
            });
        });
    },
    updateMeal: (req, res) => {
        const mealInfo = req.body;
        const mealId = req.params.id;
        const tokenCookId = req.userId;

        dbconnection.getConnection(function(connError, conn) {
            //Not connected
            if (connError) {
                res.status(502).json({
                    status: 502,
                    result: "Couldn't connect to database"
                }); return;
            }

            logger.debug("MealId =", mealId);
            logger.debug("TokenUserId =", tokenCookId);

            conn.query('SELECT cookId FROM meal WHERE id = ?', mealId, function (dbSelectError, selectResults, selectFields) {
                // When done with the connection, release it.
                conn.release();
                
                // Handle error after the release.
                if(dbSelectError) {
                    logger.error(dbSelectError);
                    res.status(500).json({
                        status: 500,
                        result: "Error"
                    }); return;
                }

                if(selectResults.length > 0) {
                    logger.debug("Results:", selectResults);
                    if(selectResults[0].cookId == tokenCookId) {
                        conn.query('UPDATE meal SET ? WHERE id = ? AND cookId = ?', [mealInfo, mealId, tokenCookId], function (dbUpdateError, updateResults, updateFields) {
                            // When done with the connection, release it.
                            conn.release();
                            
                            // Handle error after the release.
                            if(dbUpdateError) {
                                logger.error(dbUpdateError);
                                res.status(500).json({
                                    status: 500,
                                    result: "Error"
                                }); return;
                            }

                            res.status(200).json({
                                status: 200,
                                message: `${mealId} successfully updated`,
                                result: {
                                    id: mealId,
                                    ...mealInfo
                                }
                            });
                        });
                    } else {
                        res.status(403).json({
                            status: 403,
                            message: "Not the creator of the meal"
                        });
                    }
                } else {
                    res.status(404).json({
                        status: 404,
                        message: "Meal does not exist"
                    });
                }
            });
        });
    },
    deleteMeal: (req, res) => {
        const mealId = req.params.id;
        const tokenCookId = req.userId;

        dbconnection.getConnection(function(connError, conn) {
            //Not connected
            if (connError) {
                res.status(502).json({
                    status: 502,
                    result: "Couldn't connect to database"
                }); return;
            }

            logger.debug("MealId =", mealId);
            logger.debug("TokenUserId =", tokenCookId);

            conn.query('SELECT cookId FROM meal WHERE id = ?', mealId, function (dbSelectError, selectResults, selectFields) {
                // When done with the connection, release it.
                conn.release();
                
                // Handle error after the release.
                if(dbSelectError) {
                    logger.error(dbSelectError);
                    res.status(500).json({
                        status: 500,
                        result: "Error"
                    }); return;
                }

                if(selectResults.length > 0) {
                    logger.debug("Results:", selectResults);
                    if(selectResults[0].cookId == tokenCookId) {
                        conn.query('DELETE FROM meal WHERE id = ? AND cookId = ?', [mealId, tokenCookId], function (dbDeleteError, deleteResults, deleteFields) {
                            // When done with the connection, release it.
                            conn.release();
                            
                            // Handle error after the release.
                            if(dbDeleteError) {
                                logger.error(dbDeleteError);
                                res.status(500).json({
                                    status: 500,
                                    result: "Error"
                                }); return;
                            }

                            res.status(200).json({
                                status: 200,
                                message: `Succesfully deleted meal ${mealId}`
                            });
                        });
                    } else {
                        res.status(403).json({
                            status: 403,
                            message: "Not the creator of the meal"
                        });
                    }
                } else {
                    res.status(404).json({
                        status: 404,
                        message: "Meal does not exist"
                    });
                }
            });
        });
    }
}

module.exports = controller;