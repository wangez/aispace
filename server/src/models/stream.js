const mongoose = require("mongoose");

const streamChunkSchema = new mongoose.Schema({
    chunkJSON: String,
    timeFleg: Number,
    text: String,
    textOrigin: String,
}, { collection: 'streamChunk' });

const StreamChunk = mongoose.model("StreamChunk", streamChunkSchema);

module.exports = StreamChunk