const mongoose = require('mongoose');

const historySchema = new mongoose.Schema(
    {
        label: {
            type: String,
            required: true,
            trim: true
        },
        date: {
            type: Date,
            default: Date.now
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    { collection: '_sys_history' }
);

module.exports = mongoose.model('history', historySchema);