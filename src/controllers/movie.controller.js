
let controller = {
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