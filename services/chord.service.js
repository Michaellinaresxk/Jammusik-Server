const { anthropicApi } = require('../config/anthropic.config');
class ChordService {
  async generateChordProgression(title, artist) {
    try {
      console.log('Starting chord generation...');
      console.log('API Key present:', !!process.env.ANTHROPIC_API_KEY);
      console.log('Generating chord progression for:', { title, artist });
      const response = await anthropicApi.messages.create({
        model: "claude-3-opus-20240229",
        max_tokens: 1024,
        messages: [{
          role: "user",
          content: `As a musical expert, analyze the song "${title}" by ${artist}". 
          Please provide a detailed chord analysis including:
          1. Song key
          2. Verse chord progression
          3. Chorus chord progression
          4. Common chord substitutions
          Return ONLY a JSON object with this structure:
          {
            "key": "string",
            "chords": {
              "verse": ["array of chords"],
              "chorus": ["array of chords"]
            },
            "substitutions": ["array of alternative chords"]
          }`
        }]
      });
      console.log('Anthropic Response:', response);
      if (!response?.content?.length) {
        throw new Error('No chord progression generated');
      }
      // Procesamos la respuesta
      const chordData = this._processChordResponse(response.content[0]);
      // Enriquecemos los datos
      const enrichedChordData = await this._enrichChordData(chordData);
      return enrichedChordData;
    } catch (error) {
      console.error('Error generating chord progression:', error);
      throw new Error('Failed to generate chord progression');
    }
  }
  _processChordResponse(content) {
    try {
      // Extract JSON from text response
      const jsonStart = content.text.indexOf('{');
      const jsonEnd = content.text.lastIndexOf('}') + 1;
      const jsonString = content.text.slice(jsonStart, jsonEnd);

      const chordAnalysis = JSON.parse(jsonString);

      return {
        key: chordAnalysis.key,
        progressions: {
          verse: chordAnalysis.chords.verse,
          chorus: chordAnalysis.chords.chorus
        },
        substitutions: chordAnalysis.substitutions || [],
        complexity: this._calculateComplexity(chordAnalysis.chords)
      };
    } catch (error) {
      console.error('Parse error:', error);
      throw error;
    }
  }
  async _enrichChordData(chordData) {
    try {
      return {
        ...chordData,
        difficulty: this._calculateDifficulty(chordData),
        recommendations: {
          strumming: this._generateStrummingPatterns(chordData.key),
          capo: this._suggestCapoPosition(chordData.key)
        }
      };
    } catch (error) {
      console.error('Error enriching chord data:', error);
      return chordData; // Retornamos datos básicos si falla el enriquecimiento
    }
  }
  _calculateComplexity(chords) {
    const uniqueChords = new Set([...chords.verse, ...chords.chorus]);
    if (uniqueChords.size <= 4) return 'beginner';
    if (uniqueChords.size <= 6) return 'intermediate';
    return 'advanced';
  }
  _calculateDifficulty(chordData) {
    const complexityMap = {
      'beginner': 'easy',
      'intermediate': 'medium',
      'advanced': 'hard'
    };
    return complexityMap[chordData.complexity] || 'medium';
  }
  _generateStrummingPatterns(key) {
    const commonPatterns = {
      'basic': 'D DU UDU',
      'ballad': 'D D UDU',
      'rock': 'DU DU UDU'
    };
    return Object.values(commonPatterns);
  }
  _suggestCapoPosition(key) {
    const capoSuggestions = {
      'C': { position: 0, alternateKey: 'C' },
      'G': { position: 7, alternateKey: 'C' },
      'D': { position: 2, alternateKey: 'C' },
      // Añadir más sugerencias según necesites
    };
    return capoSuggestions[key] || { position: 0, alternateKey: key };
  }
}
module.exports = new ChordService();
