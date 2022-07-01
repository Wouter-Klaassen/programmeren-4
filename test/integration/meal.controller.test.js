require('dotenv').config();
process.env.DB_DATABASE = process.env.DB_DATABASE || 'share-a-meal-testdb';
process.env.LOGLEVEL = 'warn';

const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../../index');
const assert = require('assert');
const dbconnection = require('../../src/database/dbconnection');
const logger = require('../../src/config/tracer_config').logger;

const testToken = process.env.JWT_TEST_TOKEN;

//Clear database sql
const CLEAR_MEAL_TABLE = 'DELETE IGNORE FROM `meal`;';
const CLEAR_PARTICIPANTS_TABLE = 'DELETE IGNORE FROM `meal_participants_user`;';
const CLEAR_USERS_TABLE = 'DELETE IGNORE FROM `user`;';
const CLEAR_DB = CLEAR_MEAL_TABLE + CLEAR_PARTICIPANTS_TABLE + CLEAR_USERS_TABLE;

const INSERT_USER_1 = "INSERT INTO `user` (`id`, `firstName`, `lastName`, `isActive`, `emailAdress`, `password`, `phoneNumber`, `roles`, `street`, `city`) VALUES (1, 'Mariëtte', 'van den Dullemen', '1', 'm.vandullemen@server.nl', '$2a$10$2hVezbXSjDcLW7jRQzkrV.Smnu2wIobYYxTPyVSXBE7cWf/uY.4rq', '', '', '', '')";
const INSERT_USER_2 = "INSERT INTO `user` (`id`, `firstName`, `lastName`, `isActive`, `emailAdress`, `password`, `phoneNumber`, `roles`, `street`, `city`) VALUES (2, 'John', 'Doe', '1', 'j.doe@server.com', '$2a$10$7rFklPAt9V0Pnmq5LTlxD.LpbXy6O1u2j/N0XAooESE98NL94Gj8e', '06 12425475', 'editor,guest', '', '')";

const INSERT_MEAL_1 = "INSERT INTO `meal` (`id`, `isActive`, `isVega`, `isVegan`, `isToTakeHome`, `dateTime`, `maxAmountOfParticipants`, `price`, `imageUrl`, `cookId`, `createDate`, `updateDate`, `name`, `description`, `allergenes`) VALUES (1, '1', '0', '0', '1', '2022-03-22 17:35:00', '4', '12.75', 'https://miljuschka.nl/wp-content/uploads/2021/02/Pasta-bolognese-3-2.jpg', '1', '2022-02-26 18:12:40.048998', '2022-04-26 12:33:51.000000', 'Pasta Bolognese met tomaat, spekjes en kaas', 'Een heerlijke klassieker! Altijd goed voor tevreden gesmikkel!', 'gluten,lactose')";
const INSERT_MEAL_2 = "INSERT INTO `meal` (`id`, `isActive`, `isVega`, `isVegan`, `isToTakeHome`, `dateTime`, `maxAmountOfParticipants`, `price`, `imageUrl`, `cookId`, `createDate`, `updateDate`, `name`, `description`, `allergenes`) VALUES (2, '1', '1', '0', '0', '2022-05-22 13:35:00', '4', '12.75', 'https://static.ah.nl/static/recepten/img_RAM_PRD159322_1024x748_JPG.jpg', '2', '2022-02-26 18:12:40.048998', '2022-04-25 12:56:05.000000', 'Aubergine uit de oven met feta, muntrijst en tomatensaus', 'Door aubergines in de oven te roosteren worden ze heerlijk zacht. De balsamico maakt ze heerlijk zoet.', 'noten')";

chai.should();
chai.use(chaiHttp);

describe('Manage meals api/user', () => {
    describe('UC-301 Add meal', () => {
        beforeEach((done) => {
            //Connect to the database
            dbconnection.getConnection(function (connError, conn) {
                if (connError) throw connError;

                //Empty database for testing
                conn.query(CLEAR_DB + INSERT_USER_1, function (dbError, results, fields) {
                    // When done with the connection, release it.
                    conn.release();

                    // Handle error after the release.
                    if (dbError) throw dbError;

                    done();
                });
            });
        });

        it('TC-301-1 When a required input is missing, a valid error should be returned', (done) => {
            chai.request(server).post('/api/meal').auth(testToken, { type: 'bearer' }).send({
                //Name is missing
                description: "Great fries!",
                isActive: true,
                isVega: true,
                isVegan: false,
                isToTakeHome: true,
                dateTime: "1000-01-01 00:00:00",
                maxAmountOfParticipants: 1,
                price: 4,
                imageUrl: "https://media.nu.nl/m/n2jxezbayvft_wd1280.jpg/ondernemen-over-de-grens-frietboer-in-china.jpg"
            })
            .end((err, res) => {
                assert.ifError(err);

                res.should.have.status(400);
                res.should.be.an('object');
                res.body.should.be.an('object').that.has.all.keys('status', 'message');

                let { status, message } = res.body;
                status.should.be.a('number');
                message.should.be.a('string').that.equals('Name must be a string');
                
                done();
            });
        });

        it('TC-301-2 User is not logged in', (done) => {
            chai.request(server).post('/api/meal').auth("", { type: 'bearer' }).send({
                name: 'Fries',
                description: "Great fries!",
                isActive: true,
                isVega: true,
                isVegan: false,
                isToTakeHome: true,
                dateTime: "1000-01-01 00:00:00",
                maxAmountOfParticipants: 1,
                price: 4,
                imageUrl: "https://media.nu.nl/m/n2jxezbayvft_wd1280.jpg/ondernemen-over-de-grens-frietboer-in-china.jpg"
            })
            .end((err, res) => {
                assert.ifError(err);

                res.should.have.status(401);
                res.should.be.an('object');
                res.body.should.be.an('object').that.has.all.keys('status', 'message');

                let { status, message } = res.body;
                status.should.be.a('number');
                message.should.be.a('string').that.equals('Not authorized');
                
                done();
            });
        });

        it('TC-301-3 Added meal succesfully', (done) => {
            chai.request(server).post('/api/meal').auth(testToken, { type: 'bearer' }).send({
                name: 'Fries',
                description: "Great fries!",
                isActive: true,
                isVega: true,
                isVegan: false,
                isToTakeHome: true,
                dateTime: "1000-01-01 00:00:00",
                maxAmountOfParticipants: 1,
                price: 4,
                imageUrl: "https://media.nu.nl/m/n2jxezbayvft_wd1280.jpg/ondernemen-over-de-grens-frietboer-in-china.jpg"
            })
            .end((err, res) => {
                assert.ifError(err);

                res.should.have.status(201);
                res.should.be.an('object');
                res.body.should.be.an('object').that.has.all.keys('status', 'result');

                let { status, result } = res.body;
                status.should.be.a('number');
                result.should.be.an('object').that.has.all.keys("id", "cookId", "name", "description", "isActive", "isVega", "isVegan", "isToTakeHome", "dateTime", "maxAmountOfParticipants", "price", "imageUrl")
                
                done();
            });
        });
    });

    describe('UC-302 Update meal', () => {
        beforeEach((done) => {
            //Connect to the database
            dbconnection.getConnection(function (connError, conn) {
                if (connError) throw connError;

                //Empty database for testing and add a user
                conn.query(CLEAR_DB + INSERT_USER_1, function (dbError, results, fields) {

                    //Add the meal after the user was inserted to use the cookId as foreign key
                    conn.query(INSERT_MEAL_1, function (dbError, results, fields) {
                        
                        // When done with the connection, release it.
                        conn.release();

                        // Handle error after the release.
                        if (dbError) throw dbError;

                        done();
                    });
                });
            });
        });

        it('TC-302-1 When a required input is missing, a valid error should be returned', (done) => {
            chai.request(server).put('/api/meal/1').auth(testToken, { type: 'bearer' }).send({
                //Name is missing
                description: "Een heerlijke klassieker! Altijd goed voor tevreden gesmikkel!",
                isActive: true,
                isVega: false,
                isVegan: false,
                isToTakeHome: true,
                dateTime: "1000-01-01 00:00:00",
                maxAmountOfParticipants: 5,
                price: 16,
                imageUrl: "https://miljuschka.nl/wp-content/uploads/2021/02/Pasta-bolognese-3-2.jpg"
            })
            .end((err, res) => {
                assert.ifError(err);

                res.should.have.status(400);
                res.should.be.an('object');
                res.body.should.be.an('object').that.has.all.keys('status', 'message');

                let { status, message } = res.body;
                status.should.be.a('number');
                message.should.be.a('string').that.equals('Name must be a string');
                
                done();
            });
        });

        it('TC-302-2 Not logged in', (done) => {
            chai.request(server).put('/api/meal/1').auth("", { type: 'bearer' }).send({
                name: "Pasta Bolognese met tomaat, spekjes en kaassssssssss",
                description: "Een heerlijke klassieker! Altijd goed voor tevreden gesmikkel!",
                isActive: true,
                isVega: false,
                isVegan: false,
                isToTakeHome: true,
                dateTime: "1000-01-01 00:00:00",
                maxAmountOfParticipants: 5,
                price: 16,
                imageUrl: "https://miljuschka.nl/wp-content/uploads/2021/02/Pasta-bolognese-3-2.jpg"
            })
            .end((err, res) => {
                assert.ifError(err);

                res.should.have.status(401);
                res.should.be.an('object');
                res.body.should.be.an('object').that.has.all.keys('status', 'message');

                let { status, message } = res.body;
                status.should.be.a('number');
                message.should.be.a('string').that.equals('Not authorized');
                
                done();
            });
        });

        it('TC-302-3 Actor is not the owner', (done) => {
            dbconnection.getConnection(function (connError, conn) {
                if (connError) throw connError;

                //Empty database for testing and add a second user
                conn.query(CLEAR_DB + INSERT_USER_2, function (dbError, results, fields) {

                    //Add the meal after the second user was inserted to use the cookId as foreign key
                    conn.query(INSERT_MEAL_2, function (dbError, results, fields) {
                        
                        // When done with the connection, release it.
                        conn.release();

                        // Handle error after the release.
                        if (dbError) throw dbError;

                        chai.request(server).put('/api/meal/2').auth(testToken, { type: 'bearer' }).send({
                            name: "Pasta Bolognese met tomaat, spekjes en kaassssssssss",
                            description: "Een heerlijke klassieker! Altijd goed voor tevreden gesmikkel!",
                            isActive: true,
                            isVega: false,
                            isVegan: false,
                            isToTakeHome: true,
                            dateTime: "1000-01-01 00:00:00",
                            maxAmountOfParticipants: 5,
                            price: 16,
                            imageUrl: "https://miljuschka.nl/wp-content/uploads/2021/02/Pasta-bolognese-3-2.jpg"
                        })
                        .end((err, res) => {
                            assert.ifError(err);
            
                            res.should.have.status(403);
                            res.should.be.an('object');
                            res.body.should.be.an('object').that.has.all.keys('status', 'message');
            
                            let { status, message } = res.body;
                            status.should.be.a('number');
                            message.should.be.a('string').that.equals('Not the creator of the meal');
                            
                            done();
                        });
                    });
                });
            });
        });

        it(`TC-302-4 Meal doesn't exist`, (done) => {
            chai.request(server).put('/api/meal/0').auth(testToken, { type: 'bearer' }).send({
                name: "Pasta Bolognese met tomaat, spekjes en kaassssssssss",
                description: "Een heerlijke klassieker! Altijd goed voor tevreden gesmikkel!",
                isActive: true,
                isVega: false,
                isVegan: false,
                isToTakeHome: true,
                dateTime: "1000-01-01 00:00:00",
                maxAmountOfParticipants: 5,
                price: 16,
                imageUrl: "https://miljuschka.nl/wp-content/uploads/2021/02/Pasta-bolognese-3-2.jpg"
            })
            .end((err, res) => {
                assert.ifError(err);

                res.should.have.status(404);
                res.should.be.an('object');
                res.body.should.be.an('object').that.has.all.keys('status', 'message');

                let { status, message } = res.body;
                status.should.be.a('number');
                message.should.be.a('string').that.equals('Meal does not exist');
                
                done();
            });
        });

        it('TC-302-5 Meal succesfully update', (done) => {
            const mealId = 1;
            let newMealInfo = {
                name: "Pasta Bolognese met tomaat, spekjes en kaassssssssss",
                description: "Een heerlijke klassieker! Altijd goed voor tevreden gesmikkel!",
                isActive: true,
                isVega: false,
                isVegan: false,
                isToTakeHome: true,
                dateTime: "1000-01-01 00:00:00",
                maxAmountOfParticipants: 5,
                price: 16.75,
                imageUrl: "https://miljuschka.nl/wp-content/uploads/2021/02/Pasta-bolognese-3-2.jpg"
            }

            chai.request(server).put(`/api/meal/${mealId}`).auth(testToken, { type: 'bearer' }).send(newMealInfo)
            .end((errorUpdate, res) => {
                assert.ifError(errorUpdate);

                res.should.have.status(200);
                res.should.be.an('object');
                res.body.should.be.an('object').that.has.all.keys('status', 'message', "result");

                let { status, message } = res.body;
                status.should.be.a('number');
                message.should.be.a('string');

                chai.request(server).get(`/api/meal/${mealId}`).auth(testToken, { type: 'bearer' })
                .end((errorGet, res) => {
                    assert.ifError(errorGet);

                    res.should.have.status(200);
                    res.should.be.an('object');
                    res.body.should.be.an('object').that.has.all.keys('status', 'result');

                    let { status, result } = res.body;
                    status.should.be.a('number');
                    result.should.be.a('object');

                    //Convert 0 and 1's to true or false
                    if(result.isActive === 0) {
                        result.isActive = false;
                    } else if(result.isActive === 1) {
                        result.isActive = true;
                    }
    
                    if(result.isVega === 0) {
                        result.isVega = false;
                    } else if(result.isVega === 1) {
                        result.isVega = true;
                    }
    
                    if(result.isVegan === 0) {
                        result.isVegan = false;
                    } else if(result.isVegan === 1) {
                        result.isVegan = true;
                    }
    
                    if(result.isToTakeHome === 0) {
                        result.isToTakeHome = false;
                    } else if(result.isToTakeHome === 1) {
                        result.isToTakeHome = true;
                    }
                    
                    let { dateTime, ...newMealInfoCheck } = newMealInfo;
                    result.price = parseFloat(result.price);

                    //Check if the updated version is the same as the one in the database
                    result.should.contain(newMealInfoCheck);

                    done();
                });
            });
        });
    });

    describe('UC-303 Get all meals', () => {
        beforeEach((done) => {
            //Connect to the database
            dbconnection.getConnection(function (connError, conn) {
                if (connError) throw connError;

                //Empty database for testing and add a user
                conn.query(CLEAR_DB + INSERT_USER_1, function (dbError, results, fields) {

                    //Add the meal after the user was inserted to use the cookId as foreign key
                    conn.query(INSERT_MEAL_1, function (dbError, results, fields) {
                        
                        // When done with the connection, release it.
                        conn.release();

                        // Handle error after the release.
                        if (dbError) throw dbError;

                        done();
                    });
                });
            });
        });

        it('TC-303-1 ', (done) => {
            chai.request(server).get('/api/meal')
            .end((err, res) => {
                assert.ifError(err);

                res.should.have.status(200);
                res.should.be.an('object');
                res.body.should.be.an('object').that.has.all.keys('status', 'result');

                let { status, result } = res.body;
                status.should.be.a('number');
                result.should.be.an('array');
                result.should.have.lengthOf(1);
                for(meal of result) {
                    meal.should.include.all.keys("id", "name", "description", "isActive", "isVega", "isVegan", "isToTakeHome", "dateTime", "maxAmountOfParticipants", "price", "imageUrl", "cookId", "createDate", "updateDate", "allergenes");
                }
                
                done();
            });
        });
    });

    describe('UC-304 Get meal details', () => {
        beforeEach((done) => {
            //Connect to the database
            dbconnection.getConnection(function (connError, conn) {
                if (connError) throw connError;

                //Empty database for testing and add a user
                conn.query(CLEAR_DB + INSERT_USER_1, function (dbError, results, fields) {

                    //Add the meal after the user was inserted to use the cookId as foreign key
                    conn.query(INSERT_MEAL_1, function (dbError, results, fields) {
                        
                        // When done with the connection, release it.
                        conn.release();

                        // Handle error after the release.
                        if (dbError) throw dbError;

                        done();
                    });
                });
            });
        });

        it(`TC-304-1 Meal doesn't exist`, (done) => {
            chai.request(server).get('/api/meal/0')
            .end((err, res) => {
                assert.ifError(err);

                res.should.have.status(404);
                res.should.be.an('object');
                res.body.should.be.an('object').that.has.all.keys('status', 'message');

                let { status, message } = res.body;
                status.should.be.a('number');
                message.should.be.a('string').that.equals('Meal does not exist');
                
                done();
            });
        });

        it('TC-304-2 Meal details are succesfully returned', (done) => {
            chai.request(server).get('/api/meal/1')
            .end((err, res) => {
                assert.ifError(err);

                res.should.have.status(200);
                res.should.be.an('object');
                res.body.should.be.an('object').that.has.all.keys('status', 'result');

                let { status, result } = res.body;
                status.should.be.a('number');
                result.should.be.an('object').that.has.all.keys("id", "name", "description", "isActive", "isVega", "isVegan", "isToTakeHome", "dateTime", "maxAmountOfParticipants", "price", "imageUrl", "cookId", "createDate", "updateDate", "allergenes");
                
                done();
            });
        });
    });

    describe('UC-305 Delete meal', () => {
        beforeEach((done) => {
            //Connect to the database
            dbconnection.getConnection(function (connError, conn) {
                if (connError) throw connError;

                //Empty database for testing and add a user
                conn.query(CLEAR_DB + INSERT_USER_1, function (dbError, results, fields) {

                    //Add the meal after the user was inserted to use the cookId as foreign key
                    conn.query(INSERT_MEAL_1, function (dbError, results, fields) {
                        
                        // When done with the connection, release it.
                        conn.release();

                        // Handle error after the release.
                        if (dbError) throw dbError;

                        done();
                    });
                });
            });
        });

        it('TC-305-2 Not logged in', (done) => {
            chai.request(server).delete('/api/meal/1').auth("", { type: 'bearer' })
            .end((err, res) => {
                assert.ifError(err);

                res.should.have.status(401);
                res.should.be.an('object');
                res.body.should.be.an('object').that.has.all.keys('status', 'message');

                let { status, message } = res.body;
                status.should.be.a('number');
                message.should.be.a('string').that.equals('Not authorized');
                
                done();
            });
        });

        it(`TC-305-3 Not the creator of the meal`, (done) => {
            dbconnection.getConnection(function (connError, conn) {
                if (connError) throw connError;

                //Empty database for testing and add a second user
                conn.query(CLEAR_DB + INSERT_USER_2, function (dbError, results, fields) {

                    //Add the meal after the second user was inserted to use the cookId as foreign key
                    conn.query(INSERT_MEAL_2, function (dbError, results, fields) {
                        
                        // When done with the connection, release it.
                        conn.release();

                        // Handle error after the release.
                        if (dbError) throw dbError;

                        chai.request(server).delete('/api/meal/2').auth(testToken, { type: 'bearer' })
                        .end((err, res) => {
                            assert.ifError(err);

                            res.should.have.status(403);
                            res.should.be.an('object');
                            res.body.should.be.an('object').that.has.all.keys('status', 'message');

                            let { status, message } = res.body;
                            status.should.be.a('number');
                            message.should.be.a('string').that.equals('Not the creator of the meal');
                            
                            done();
                        });
                    });
                });
            });
        });

        it(`TC-305-4 Meal doesn't exist`, (done) => {
            chai.request(server).delete('/api/meal/0').auth(testToken, { type: 'bearer' })
            .end((err, res) => {
                assert.ifError(err);

                res.should.have.status(404);
                res.should.be.an('object');
                res.body.should.be.an('object').that.has.all.keys('status', 'message');

                let { status, message } = res.body;
                status.should.be.a('number');
                message.should.be.a('string').that.equals('Meal does not exist');
                
                done();
            });
        });

        it(`TC-305-5 Meal succesfully deleted`, (done) => {
            const meal_id = 1;
            chai.request(server).delete(`/api/meal/${meal_id}`).auth(testToken, { type: 'bearer' })
            .end((err, res) => {
                assert.ifError(err);

                res.should.have.status(200);
                res.should.be.an('object');
                res.body.should.be.an('object').that.has.all.keys('status', 'message');

                let { status, message } = res.body;
                status.should.be.a('number');
                message.should.be.a('string').that.equals(`Succesfully deleted meal ${meal_id}`);
                
                done();
            });
        });
    });
});