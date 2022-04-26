const express = require('require');
const movieController = require('../controllers/movie.controller')
const app = express();
const port = process.env.PORT || 3000;
const bodyParser = require('body-parser');
const router = require('./src/routes/movie.routes');

app.use(bodyParser.json());

app.all("*", (req,res) => {

});

app.use(movieRouter);


app.all('*', (req, res)=>{

});

module.exports = router;