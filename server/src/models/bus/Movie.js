const mongoose = require('mongoose');
const { busConnection } = require('../../config/database')

const movieSchema = new mongoose.Schema(
    {
        box_office: {
            type: String,
            required: true,
        },
        cast: {
            type: String,
            required: true,
        },
        director: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        rank: {
            type: Number,
            required: true,
        },
        release_date: {
            type: String,
            required: true,
        },
        year: {
            type: Number,
            required: true,
        },
    },
    {
        collection: 'movie',
        timestamps: false,
    }
);

const Movie = busConnection.model('movie', movieSchema);

module.exports = Movie;