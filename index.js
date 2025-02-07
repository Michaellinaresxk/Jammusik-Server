const express = require('express');
const cors = require('cors');
const tracksRoutes = require('./routes/tracks.routes');
const chordRoutes = require('./routes/chord.routes');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Basic routes
app.get('/api', (req, res) => {
  res.json({ message: 'API is running' });
});

// API routes con manejo de errores
app.use('/api', async (req, res, next) => {
  try {
    await tracksRoutes(req, res, next);
  } catch (error) {
    console.error('Routes error:', error);
    next(error);
  }
});

app.use('/api/chords', async (req, res, next) => {
  try {
    await chordRoutes(req, res, next);
  } catch (error) {
    console.error('Chords routes error:', error);
    next(error);
  }
});

// Error handling middleware mejorado
app.use((err, req, res, next) => {
  console.error('Error caught in middleware:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method
  });

  // Errores específicos de Spotify
  if (err.name === 'SpotifyWebApiError') {
    return res.status(400).json({
      error: 'Spotify API error',
      message: err.message
    });
  }

  // Error general
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    status: err.status || 500,
    path: req.path
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Solo iniciar el servidor si no estamos en Vercel
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
    🚀 Server is running!
    🎵 Test the server: http://192.168.1.10:${PORT}/api/test
    🔍 Test Spotify endpoints: http://192.168.1.10:${PORT}/api/test-endpoints
    🎸 Get new releases: http://192.168.1.10:${PORT}/api/browse/new-releases
    🎧 Get chords: http://192.168.1.10:${PORT}/api/chords/test
  `);
});

module.exports = app;