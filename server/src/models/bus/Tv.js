const mongoose = require('mongoose');
const { busConnection } = require('../../config/database')

const tvSchema = new mongoose.Schema(
    {
        cast: {
            type: String,
            required: true,
        },
        director: {
            type: String,
            required: true,
        },
        episodes: {
            type: Number,
            required: true,
        },
        name: {
            type: String,
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
        collection: 'tv',
        timestamps: false,
    }
);

const TV = busConnection.model('tv', tvSchema);

module.exports = TV;