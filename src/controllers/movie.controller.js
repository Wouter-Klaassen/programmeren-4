const assert = require('assert');
const { json } = require('express');
const dbconnection = require('../../database/dbconnection')
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
            const error={
                status:400,
                result: err.message,
            };

            next(error);
        }
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

        dbconnection.getConnection(function(err, connection){
            if (err) throw err
          
            connection.query(
              'SELECT name, id FROM meal;',
              function (error, results, fields) {
          
                connection.release
          
                if (error) throw error;
                
                console.log('#results = ', results.length);
                res.status(200).json(
                    {
                        statusCode: 200,
                        results: results
                    }
                )
                
                pool.end((err)=>{
                  console.log('pool was closed.')
                })
              }
            )
          })
    },
    getMovieById: (req, res, next) => {
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
            const error={}
          res.status(401).json({
            status: 401,
            result: 'Movie with ID ${movieId} not found',
          });
        }
    },
};


module.exports = controller;