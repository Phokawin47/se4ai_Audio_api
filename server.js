require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware - Allow all origins (can be restricted per service later)
app.use(cors());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI_AUDIO;
if (!MONGODB_URI) {
    console.error('ERROR: MONGODB_URI_AUDIO is not defined in .env');
    process.exit(1);
}

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {

}).then(() => {
    console.log('Successfully connected to Audio MongoDB Database');
}).catch((err) => {
    console.error('MongoDB connection error:', err);
});

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ status: 'ok', service: 'Audio API' });
});

// ✅ IMPORTANT: More-specific routes must come BEFORE catch-all routes!

// GET /audio/SFXFiles/:filename - Stream SFX from 'SFXFiles' GridFS bucket
app.get('/audio/SFXFiles/:filename', async (req, res) => {
    try {
        const { filename } = req.params;

        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database connection not ready' });
        }

        const db = mongoose.connection.getClient().db();
        const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: "SFXFiles" });

        const files = await bucket.find({ filename }).toArray();
        if (!files.length) {
            return res.status(404).json({ error: "File not found", filename });
        }

        const file = files[0];
        const contentType = file.contentType || file.metadata?.contentType || "audio/mpeg";

        res.set({
            "Content-Type": contentType,
            "Content-Length": file.length,
            "Cache-Control": "no-store",
            "Accept-Ranges": "bytes"
        });

        const downloadStream = bucket.openDownloadStreamByName(filename);
        downloadStream.on('error', (err) => {
            console.error('GridFS stream error:', err);
            if (!res.headersSent) res.status(500).json({ error: 'Error streaming file' });
        });
        downloadStream.pipe(res);

    } catch (error) {
        console.error('Error fetching SFX audio:', error);
        if (!res.headersSent) res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /audio/:filename - Stream number audio from 'audioFiles' GridFS bucket
app.get('/audio/:filename', async (req, res) => {
    try {
        const { filename } = req.params;

        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database connection not ready' });
        }

        const db = mongoose.connection.getClient().db();
        const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: "audioFiles" });

        const files = await bucket.find({ filename }).toArray();
        if (!files.length) {
            return res.status(404).json({ error: "File not found", filename });
        }

        const file = files[0];
        const contentType = file.contentType || file.metadata?.contentType || "audio/mpeg";

        res.set({
            "Content-Type": contentType,
            "Content-Length": file.length,
            "Cache-Control": "no-store",
            "Accept-Ranges": "bytes"
        });

        const downloadStream = bucket.openDownloadStreamByName(filename);
        downloadStream.on('error', (err) => {
            console.error('GridFS stream error:', err);
            if (!res.headersSent) res.status(500).json({ error: 'Error streaming file' });
        });
        downloadStream.pipe(res);

    } catch (error) {
        console.error('Error fetching audio:', error);
        if (!res.headersSent) res.status(500).json({ error: 'Internal Server Error' });
    }
});


// Start the server
app.listen(PORT, () => {
    console.log(`Audio API service running on port ${PORT}`);
});
