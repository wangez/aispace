const express = require('express');
const router = express.Router();
const Metadata = require('../models/Metadata');
const { buildCollectionDocument } = require('../utils/schemaTextBuilder');
const { getEmbedding } = require('../services/embeddingService');
const { upsertVector } = require('../services/vectorStore');

// 获取元数据列表
router.get('/', async (req, res) => {
    try {
        const metadata = await Metadata.find({}).sort({ collectionName: -1 });
        res.json({
            success: true,
            data: metadata
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// 修改元数据
router.post('/updateMeta', async (req, res) => {
    try {
        const metadata = await Metadata.findById(req.body._id);
        Object.assign(metadata, req.body);
        metadata.vectorExtracted = false
        await metadata.save();

        res.json({
            success: true,
            message: '提取成功',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// 提取向量
router.post('/', async (req, res) => {
    try {
        const metadata = await Metadata.findById(req.body._id);
        const documentText = buildCollectionDocument(metadata);
        const vector = await getEmbedding(documentText);
        // 3. 存储到 ChromaDB
        await upsertVector(metadata.collectionName, documentText, vector, {
            originalId: metadata._id.toString(),
            description: metadata.description,
        });

        // 4. 更新 MongoDB 中的标志位
        metadata.vectorExtracted = true;
        await metadata.save();

        res.json({
            success: true,
            message: '提取成功',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

module.exports = router;