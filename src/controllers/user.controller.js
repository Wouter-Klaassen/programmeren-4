require('dotenv').config();
const assert = require('assert');
const { off } = require('process');

const dbconnection = require('../database/dbconnection');
const saltRounds = parseInt(process.env.SALT_ROUNDS);
const bcrypt = require('bcrypt');
const logger = require('../config/tracer_config').logger;
const emailValidator = require("email-validator");

let controller = {
    validateUser: (req, res, next) => {
        let user = req.body;
        let {firstName, lastName, street, city, isActive, emailAdress, phoneNumber, password} = user;
        try {
            //Check if each field has the correct type
            assert(typeof firstName === 'string', 'Firstname must be a string');
            assert(typeof lastName === 'string', 'LastName must be a string');
            assert(typeof street === 'string', 'Street must be a string');
            assert(typeof city === 'string', 'City must be a string');
            assert(typeof isActive === 'boolean', 'IsActive must be a boolean');
            assert(typeof emailAdress === 'string', 'EmailAddress must be a string');
            assert(typeof phoneNumber === 'string', 'PhoneNumber must be a string');
            assert(typeof password === 'string', 'Password must a string');

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
    addUser: (req, res) => {
        let user = req.body;
        dbconnection.getConnection(function(connError, conn) {
            //Not connected
            if (connError) {
                res.status(502).json({
                    status: 502,
                    result: "Couldn't connect to database"
                }); return;
            }

            //Check if the email is valid
            if(!emailValidator.validate(user.emailAdress)) {
                res.status(400).json({
                    status: 400,
                    message: "Email is not valid"
                }); return;
            }

            //Check if the password is valid
            const passwordRegex = /(?=.*[A-Z])(?=.*[0-9])(?=.{8,})/gm
            if(!passwordRegex.test(user.password)) {
                res.status(400).json({
                    status: 400,
                    message: "Password must contain at least one uppercase letter, one number and be 8 characters long"
                }); return;
            }

            //Hash the password
            user.password = bcrypt.hashSync(user.password, saltRounds);
            
            //Insert the user object into the database
            conn.query(`INSERT INTO user SET ?`, user, function (dbError, result, fields) {
                // When done with the connection, release it.
                conn.release();

                // Handle error after the release.
                if(dbError) {
                    logger.debug(dbError);
                    if(dbError.errno == 1062) {
                        res.status(409).json({
                            status: 409,
                            message: "Email is already used"
                        });
                    } else {
                        logger.error(dbError);
                        res.status(500).json({
                            status: 500,
                            result: "Error"
                        });
                    }
                } else {
                    res.status(201).json({
                        status: 201,
                        result: {
                            id: result.insertId,
                            ...user
                        }
                    });
                }
            });
        });
    },
    getAllUsers: (req, res) => {
        let {id, firstName, lastName, street, city, isActive, emailAdress, phoneNumber} = req.query;

        if(!id) { id = '%'}
        if(!firstName) { firstName = '%' }
        if(!lastName) { lastName = '%' }
        if(!street) {street = '%' }
        if(!city) { city = '%' }
        if(!isActive) { isActive = '%' }
        if(!emailAdress) { emailAdress = '%' }
        if(!phoneNumber) { phoneNumber = '%'}

        dbconnection.getConnection(function(connError, conn) {
            //Not connected
            if (connError) {
                res.status(502).json({
                    status: 502,
                    result: "Couldn't connect to database"
                }); return;
            }
            
            conn.query(`SELECT id, firstName, lastName, isActive, emailAdress, phoneNumber, roles, street, city 
            FROM user WHERE id LIKE ? AND firstName LIKE ? AND lastName LIKE ? AND street LIKE ? AND city LIKE ? AND isActive LIKE ? AND emailAdress LIKE ? AND phoneNumber LIKE ?`,
            [id, '%' + firstName + '%', '%' + lastName + '%', '%' + street + '%', '%' + city + '%', isActive, '%' + emailAdress + '%', '%' + phoneNumber + '%'], function (dbError, results, fields) {
                // When done with the connection, release it.
                conn.release();
                
                // Handle error after the release.
                if (dbError) {
                    if(dbError.errno === 1064) {
                        res.status(400).json({
                            status: 400,
                            message: "Something went wrong with the filter URL"
                        }); return;
                    } else {
                        logger.error(dbError);
                        res.status(500).json({
                            status: 500,
                            result: "Error"
                        }); return;
                    }
                }
                
                res.status(200).json({
                    status: 200,
                    result: results
                });
            });
        });
    },
    getUserProfile: (req, res) => {
        const userId = req.userId;
        dbconnection.getConnection(function(connError, conn) {
            //Not connected
            if (connError) {
                res.status(502).json({
                    status: 502,
                    result: "Couldn't connect to database"
                }); return;
            }
            
            conn.query('SELECT * FROM user WHERE id = ' + userId, function (dbError, results, fields) {
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
                        message: "User does not exist"
                    });
                }
            });
        });
    },
    getUserById: (req, res) => {
        const userId = req.params.id;
        dbconnection.getConnection(function(connError, conn) {
            //Not connected
            if (connError) {
                res.status(502).json({
                    status: 502,
                    result: "Couldn't connect to database"
                }); return;
            }
            
            conn.query('SELECT * FROM user WHERE id = ' + userId, function (dbError, results, fields) {
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
                        message: "User does not exist"
                    });
                }
            });
        });
    },
    updateUser: (req, res) => {
        const newUserInfo = req.body;
        const userId = req.params.id;
        dbconnection.getConnection(function(connError, conn) {
            //Not connected
            if (connError) {
                res.status(502).json({
                    status: 502,
                    result: "Couldn't connect to database"
                }); return;
            }

            //Check if the phonenumber is valid
            const phoneNumberRegex = /(^\+[0-9]{2}|^\+[0-9]{2}\(0\)|^\(\+[0-9]{2}\)\(0\)|^00[0-9]{2}|^0)([0-9]{9}$|[0-9\-\s]{10}$)/gm
            if(!phoneNumberRegex.test(newUserInfo.phoneNumber)) {
                res.status(400).json({
                    status: 400,
                    message: "Invalid phonenumber (Examples: +31612345678, 0612345678)"
                }); return;
            }

            //Hash the password
            newUserInfo.password = bcrypt.hashSync(newUserInfo.password, saltRounds);
            
            conn.query('UPDATE user SET ? WHERE id = ?', [newUserInfo, userId], function (dbError, results, fields) {
                // When done with the connection, release it.
                conn.release();
                
                // Handle error after the release.
                if(results.affectedRows > 0) {
                    res.status(200).json({
                        status: 200,
                        message: `${userId} successfully updated`,
                        result: {
                            id: userId,
                            ...newUserInfo
                        }
                    });
                } else {
                    if(dbError == null) {
                        res.status(400).json({
                            status: 400,
                            result: "User does not exist"
                        });
                    } else {
                        logger.error(dbError);
                        res.status(500).json({
                            status: 500,
                            result: "Error"
                        });
                    }
                }
            });
        });
    },
    deleteUser: (req, res) => {
        const userId = req.params.id;
        const tokenUserId = req.userId;
        dbconnection.getConnection(function(connError, conn) {
            //Not connected
            if (connError) {
                res.status(502).json({
                    status: 502,
                    result: "Couldn't connect to database"
                }); return;
            }

            logger.debug("UserId =", userId);
            logger.debug("TokenUserId =", tokenUserId);
            if(userId != tokenUserId) {
                res.status(403).json({
                    status: 403,
                    message: 'Not authorized',
                }); return;
            }
            
            conn.query('DELETE FROM user WHERE id = ?', userId, function (dbError, results, fields) {
                // When done with the connection, release it.
                conn.release();
                
                // Handle error after the release.
                if(dbError) {
                    logger.error(dbError);
                    res.status(500).json({
                        status: 500,
                        result: "Error"
                    }); return;
                }
                
                if(results.affectedRows > 0) {
                    res.status(200).json({
                        status: 200,
                        message: `User: ${userId} successfully deleted`
                    });
                } else {
                    res.status(400).json({
                        status: 400,
                        message: "User does not exist"
                    });
                }
            });
        });
    }
}

module.exports = controller;