const express = require('express')
const movieController = require('../controllers/movie.controller')
const router = express.Router()

router.post(
    '/movie',
    movieController.validateMovie,
    movieController.createMovie
)
router.get('/movie', movieController.getAll)
router.get('/movie/:id', movieController.getById)

module.exports = router