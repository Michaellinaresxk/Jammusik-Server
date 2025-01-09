const SpotifyService = require('../services/spotify.service');

exports.getTopTracks = async (req, res) => {
  try {
    const tracks = await SpotifyService.getTopTracks();
    res.json(tracks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTrackDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const track = await SpotifyService.getTrackDetails(id);
    res.json(track);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
