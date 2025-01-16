// src/app.js
const express = require('express');
const cors = require('cors');
const tracksRoutes = require('./routes/tracks.routes');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.get('/test', (req, res) => {
  res.json({ message: 'Server is running!' });
});

app.get('/api', (req, res) => {
  res.json({ message: 'We are ready!' });
});

app.use('/api', tracksRoutes);

// Solo inicia el servidor si no está en Vercel
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`
      🚀 Server is running!
      🎵 Test the server: http://localhost:${PORT}/test
      🎧 Get top tracks: http://localhost:${PORT}/api/tracks/top
     🎸 Get new releases: http://localhost:${PORT}/api/browse/new-releases
     http://localhost:${PORT}/api/browse/categories
    `);
  });
}

// Exporta la app para Vercel
module.exports = app;