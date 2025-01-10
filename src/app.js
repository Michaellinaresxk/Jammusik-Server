// src/app.js
const express = require('express');
const cors = require('cors');
const tracksRoutes = require('./routes/tracks.routes');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: '*',  // In production, specify actual origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Ruta de prueba
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running!' });
});

app.get('/api', (req, res) => {
  res.json({ message: 'We are ready!' });
});

// Rutas de Spotify
app.use('/api', tracksRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`
    🚀 Server is running!
    🎵 Test the server: http://localhost:${PORT}/test
    🎧 Get top tracks: http://localhost:${PORT}/api/tracks/top
  `);
});