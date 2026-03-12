require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
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

// GET /audio/:filename - Stream audio file from GridFS
app.get('/audio/:filename', async (req, res) => {
    try {
        const { filename } = req.params;

        // Ensure database connection is ready
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database connection not ready' });
        }

        const db = mongoose.connection.getClient().db();
        const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: "audioFiles" });

        // Find file
        const files = await bucket.find({ filename }).toArray();
        if (!files.length) {
            return res.status(404).json({ error: "File not found", filename });
        }

        const file = files[0];
        const contentType = file.contentType || file.metadata?.contentType || "audio/mpeg";

        // Set response headers for streaming audio
        res.set({
            "Content-Type": contentType,
            "Content-Length": file.length,
            "Cache-Control": "no-store", // Prevent caching since users might repeatedly play
            "Accept-Ranges": "bytes"
        });

        // Open stream and pipe to response
        const downloadStream = bucket.openDownloadStreamByName(filename);
        
        // Handle stream errors
        downloadStream.on('error', (err) => {
            console.error('GridFS stream error:', err);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Error streaming file' });
            }
        });

        // Pipe to client
        downloadStream.pipe(res);

    } catch (error) {
        console.error('Error fetching audio:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
});


// GET /audio/:filename - Stream audio file from GridFS
app.get('/audio/SFXFiles/:filename', async (req, res) => {
    try {
        const { filename } = req.params;

        // Ensure database connection is ready
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database connection not ready' });
        }

        const db = mongoose.connection.getClient().db();
        const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: "SFXFiles" });

        // Find file
        const files = await bucket.find({ filename }).toArray();
        if (!files.length) {
            return res.status(404).json({ error: "File not found", filename });
        }

        const file = files[0];
        const contentType = file.contentType || file.metadata?.contentType || "audio/mpeg";

        // Set response headers for streaming audio
        res.set({
            "Content-Type": contentType,
            "Content-Length": file.length,
            "Cache-Control": "no-store", // Prevent caching since users might repeatedly play
            "Accept-Ranges": "bytes"
        });

        // Open stream and pipe to response
        const downloadStream = bucket.openDownloadStreamByName(filename);
        
        // Handle stream errors
        downloadStream.on('error', (err) => {
            console.error('GridFS stream error:', err);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Error streaming file' });
            }
        });

        // Pipe to client
        downloadStream.pipe(res);

    } catch (error) {
        console.error('Error fetching audio:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
});


// Start the server
app.listen(PORT, () => {
    console.log(`Audio API service running on port ${PORT}`);
});
