const router = require('express').Router();
const chordController = require('../controller/chord.controller');
router.get('/test', (req, res) => {
  res.json({ message: 'Chord routes are working!' });
});
router.post('/generate', chordController.generateChords);
module.exports = router;