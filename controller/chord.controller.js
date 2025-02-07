const ChordService = require('../services/chord.service');
class ChordController {
  async generateChords(req, res) {
    const { title, artist } = req.body;
    if (!title || !artist) {
      return res.status(400).json({
        error: 'Title and artist are required'
      });
    }
    try {
      const chordData = await ChordService.generateChordProgression(title, artist);
      res.json(chordData);
    } catch (error) {
      console.error('Controller error:', error);
      res.status(500).json({
        error: 'Failed to generate chords',
        message: error.message
      });
    }
  }
}
module.exports = new ChordController();
