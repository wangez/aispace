const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema(
    {
        role: {
            type: String,
            required: true,
        },
        style: {
            type: String,
            required: true,
        },
        code: {
            type: String,
            required: true,
        },
    },
    { collection: 'role' }
);

const Role = mongoose.model('Role', roleSchema);

const questionTempSchema = new mongoose.Schema(
    {
        text: { type: String, required: true },
        role: { type: String, required: true },
        source: { type: String, required: true },
        updatedAt: { type: Date, default: Date.now },
        vectorExtracted: { type: Boolean, default: false }
    },
    {
        collection: 'QuestionTemp', timestamps: true
    }
);

const QuestionTemp = mongoose.model('QuestionTemp', questionTempSchema);


module.exports = {
    Role,
    QuestionTemp
}