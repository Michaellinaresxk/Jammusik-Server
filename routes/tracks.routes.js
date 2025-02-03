const router = require('express').Router();
const SpotifyService = require('../services/spotify.service');
const spotifyApi = require('../config/spotify.config');
const SpotifyEndpointsTester = require('../services/SpotifyEndpointsTester');

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

router.get('/test-endpoints', async (req, res) => {
  try {
    const tester = new SpotifyEndpointsTester(spotifyApi);
    const results = await tester.testAllEndpoints();
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/browse/track-info', async (req, res) => {
  try {
    const { title, artist } = req.query;

    if (!title || !artist) {
      return res.status(400).json({
        error: 'Both title and artist are required'
      });
    }

    const trackInfo = await SpotifyService.getDetailedTrackInfo(title, artist);
    res.json(trackInfo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;