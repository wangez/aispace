const mongoose = require('mongoose');
const { busConnection } = require('../../config/database')

const bookSchema = new mongoose.Schema(
    {
        author: {
            type: String,
            required: true
        },
        category: {
            type: String,
            required: true
        },
        isbn: {
            type: String,
            required: true
        },
        pages: {
            type: Number,
            required: true,
            min: 0
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        publication_year: {
            type: Number,
            required: true
        },
        publisher: {
            type: String,
            required: true
        },
        rating: {
            type: Number,
            required: true,
            min: 0,
            max: 5
        },
        title: {
            type: String,
            required: true
        }
    },
    {
        collection: 'book',
        timestamps: false
    }
);

const Book = busConnection.model('book', bookSchema);

module.exports = Book;