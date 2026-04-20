
const database = require('../config/database')
const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
    fieldName: { type: String, required: true },
    type: { type: String, required: true },
    description: { type: String, required: true },
    example: { type: mongoose.Schema.Types.Mixed, required: true }
});

const metadataSchema = new mongoose.Schema(
    {
        collectionName: { type: String, required: true, unique: true },
        description: { type: String, required: true },
        fields: [fieldSchema],
        updatedAt: { type: Date, default: Date.now },
        vectorExtracted: { type: Boolean, default: false } // 标志该集合的向量是否已生成
    },
    {
        collection: '_meta_schema', timestamps: true
    }
);

module.exports = database.busConnection.model('Metadata', metadataSchema);