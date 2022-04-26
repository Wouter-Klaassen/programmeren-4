const assert = require('assert');
let database=[];
let id = 0;

let controller = {
    validateMovie:(req, res, next)=>{
        let movie = req.body;
        let{title,year,studio}=movie;
        try{
            assert(typeof title === "string", 'Title must be a string');
            assert(typeof year === "number", 'Title must be a number');
            assert(typeof studio === "string", 'Title must be a string');
            next();
        }
        catch(err){
            console.log(err.code);
            console.log(err.message);
            res.status(400).json({
                status: 400,
                result: err.toString(),
            });
        }
        next();
    },
    addMovie: (req, res) => {
        let movie = req.body;
            id++;
            movie = {
            id,
        ...movie,
        };
    console.log(movie);
    database.push(movie);
    res.status(201).json({
            status: 201,
            result: movie,
        });
    },
    getAllMovies: (req, res) => {
        res.status(200).json({
            status: 200,
            result: database,
        });
    },
    getMovieById: (req, res) => {
        const movieId = req.params.movieId;
        console.log('Movie with ID ${movieId} searched');
        let movie = database.filter((item) => item.id == movieId);
        if (movie.length > 0) {
          console.log(movie);
          res.status(200).json({
            status: 200,
            result: movie,
          });
        } else {
          res.status(401).json({
            status: 401,
            result: 'Movie with ID ${movieId} not found',
          });
        }
    },
};


module.exports = controller;