const mongoose = require('mongoose');
const { busConnection } = require('../../config/database')

const productItemSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        price: {
            type: Number,
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
        },
    },
    { _id: false }
);

const orderSchema = new mongoose.Schema(
    {
        delivery_address: {
            type: String,
            required: true,
        },
        order_date: {
            type: String,
            required: true,
        },
        order_id: {
            type: String,
            required: true,
        },
        products: {
            type: [productItemSchema],
            required: true,
        },
        status: {
            type: String,
            required: true,
        },
        total_amount: {
            type: Number,
            required: true,
        },
        user_id: {
            type: String,
            required: true,
        },
        user_name: {
            type: String,
            required: true,
        },
    },
    {
        collection: 'order',
        timestamps: false,
    }
);

const Order = busConnection.model('order', orderSchema);

module.exports = Order;