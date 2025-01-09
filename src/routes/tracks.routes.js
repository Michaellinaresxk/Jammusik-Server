const router = require('express').Router();
const SpotifyService = require('../services/spotify.service');
const spotifyApi = require('../config/spotify.config');

// Middleware to secure valid token
const ensureToken = async (req, res, next) => {
  try {
    await spotifyApi.ensureToken();
    next();
  } catch (error) {
    res.status(401).json({ error: 'Failed to authenticate with Spotify' });
  }
};

// Apply middleware to all routes
router.use(ensureToken);

router.get('/tracks/top', async (req, res) => {
  try {
    console.log('Getting top tracks...');
    const tracks = await SpotifyService.getTopTracks();
    console.log(`Found ${tracks.length} tracks`);
    res.json(tracks);
  } catch (error) {
    console.error('Route error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/tracks/:id', async (req, res) => {
  try {
    const track = await SpotifyService.getTrackDetails(req.params.id);
    res.json(track);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    const tracks = await SpotifyService.searchTracks(q);
    res.json(tracks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;