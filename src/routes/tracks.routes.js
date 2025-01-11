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


router.get('/tracks/analyze', async (req, res) => {
  try {
    const { title, artist } = req.query;

    if (!title || !artist) {
      return res.status(400).json({ error: 'Title and artist are required' });
    }

    const analysis = await SpotifyService.getTrackAnalysis(title, artist);

    if (!analysis) {
      return res.status(404).json({ error: 'Track not found' });
    }

    res.json(analysis);
  } catch (error) {
    console.error('Route Error:', error);
    res.status(500).json({
      error: 'Failed to analyze track',
      details: error.message
    });
  }
});

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
  const trackId = req.params.id;

  if (!trackId) {
    return res.status(400).json({ error: 'Track ID is required' });
  }

  try {
    console.log('Attempting to fetch track details for ID:', trackId);
    const track = await SpotifyService.getTrackDetails(trackId);

    if (!track) {
      console.log('No track found for ID:', trackId);
      return res.status(404).json({ error: 'Track not found' });
    }

    console.log('Successfully retrieved track details:', track);
    res.json(track);

  } catch (error) {
    console.error('Error in track details route:', {
      trackId,
      error: error.message,
      stack: error.stack
    });

    // Si es un error específico de la API de Spotify
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        error: error.message,
        spotifyError: true
      });
    }

    res.status(500).json({
      error: 'Failed to fetch track details',
      message: error.message
    });
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