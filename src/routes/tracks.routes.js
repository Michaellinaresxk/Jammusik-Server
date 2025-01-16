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
    const tracks = await SpotifyService.getTopTracks();
    res.json(tracks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/browse/categories', async (req, res) => {
  try {
    const categories = await SpotifyService.getCategories();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Playlists for a Category
router.get('/browse/categories/:categoryId/playlists', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const playlists = await SpotifyService.getCategoryPlaylists(categoryId);
    res.json(playlists);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/browse/new-releases', async (req, res) => {
  try {
    const releases = await SpotifyService.getNewReleases();
    res.json(releases);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;