# Share A Meal

## Description

This API is a school project for programming 4. This API enables users to login and share various meals saved in our online database. 
CRUD in conjunction with our authorization software ensures all data is protected, but still approachable and unclutterd.

## Tech used

- NodeJS
- Express
- dotenv
- JSON Web Token
- Tracer
- email-validator
- Body-Parser
- MySql2
- bCrypt

### Tech used for testing purposes

- Nodemon
- Chai
- Chai-http
- Mocha

## How To

The online API can be reached via [this link](https://program-4.herokuapp.com/).
Routes used by the API can be found [here](https://shareameal-api.herokuapp.com/docs/).

### Install

1. Navigate to your preferred folder with Command Line and run this command:
```
git clone https://github.com/Wouter-Klaassen/programmeren-4.git
```
2. To install the required Nodejs modules, run this command:
```
npm install
```
3. Install [XAMPP](https://www.apachefriends.org/) into your C:\ drive and leave everything on default. Start the MySQL server.
4. Open mysql in Command Line and run [this script](share-a-meal.create.sql) to create your database. Run [this script](share-a-meal.sql) to fill your database.
5. Ensure your [.env](.env) variables match your database.
6. Run this command to start the API:
```
npm start
```

## Author

Wouter Klaassen