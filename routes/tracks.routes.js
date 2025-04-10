const router = require('express').Router();
const LastFMService = require('../services/lastfm.service');
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

// Apply middleware ONLY to Spotify routes
router.use('/browse', ensureToken); // Spotify routes
router.use('/test-endpoints', ensureToken); // Spotify testing

router.get('/test-endpoints', async (req, res) => {
  try {
    const tester = new SpotifyEndpointsTester(spotifyApi);
    const results = await tester.testAllEndpoints();
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Spotify Routes
router.get('/browse/new-releases', async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === 'true';
    const releases = await SpotifyService.getNewReleases(forceRefresh);
    res.json(releases);
  } catch (error) {
    console.error('Error in /browse/new-releases:', error);
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

    console.log(`Processing track info request for "${title}" by "${artist}"`);

    const trackInfo = await SpotifyService.getTrackInfo(title, artist);

    if (!trackInfo) {
      throw new Error('No track information returned from service');
    }

    console.log('Track info successfully retrieved');
    res.json(trackInfo);
  } catch (error) {
    console.error('Error in /browse/track-info:', error);
    res.status(500).json({ error: error.message });
  }
});

// LastFM Routes (without Spotify middleware)
router.get('/top-tracks', async (req, res) => {
  try {
    const tracks = await LastFMService.getTopTracks();
    res.json(tracks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/track-info', async (req, res) => {
  try {
    const { artist, track } = req.query;
    console.log('Received request for track:', { artist, track });

    if (!artist || !track) {
      return res.status(400).json({
        error: 'Both artist and track name are required'
      });
    }

    const lastFMService = new LastFMService();
    const trackInfo = await lastFMService.getTrackDetails(artist, track);
    console.log('Track info retrieved:', trackInfo);
    res.json(trackInfo);
  } catch (error) {
    console.error('Error in track-info route:', error);
    res.status(500).json({
      error: error.message,
      details: error.response?.data || 'No additional details available'
    });
  }
});

module.exports = router;