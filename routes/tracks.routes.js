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

router.get('/browse/new-releases', async (req, res) => {
  try {
    const releases = await SpotifyService.getNewReleases();
    res.json(releases);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;