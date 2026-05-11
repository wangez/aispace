const mongoose = require("mongoose");

const streamChunkSchema = new mongoose.Schema(
    {
        chunkJSON: String,
        timeFleg: Number,
        text: String,
        textOrigin: String,
    },
    { collection: 'util_stream_chunk' }
);

const StreamChunk = mongoose.model("StreamChunk", streamChunkSchema);

module.exports = StreamChunk