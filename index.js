const express = require('express');
const cors = require('cors');
const tracksRoutes = require('./routes/tracks.routes');
// const chordRoutes = require('./routes/chord.routes');
require('dotenv').config();
const app = express();
// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
// Basic routes
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running!' });
});
app.get('/api', (req, res) => {
  res.json({ message: 'We are ready!' });
});
// API routes
app.use('/api', tracksRoutes);
// API chords
// app.use('/api/chords', chordRoutes);
// Error handling middleware - debe ir DESPUÉS de las rutas
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});
// 404 handler - debe ir DESPUÉS de todas las rutas
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
    🚀 Server is running!
    🎵 Test the server: http://localhost:${PORT}/test
    🔍 Test Spotify endpoints: http://localhost:${PORT}/api/test-endpoints
    🎸 Get new releases: http://localhost:${PORT}/api/browse/new-releases
  `);
});
module.exports = app;
