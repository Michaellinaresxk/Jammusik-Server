const axios = require('axios');
const { API_CONFIG } = require('../config/lastfmConfig');

class LastFMService {
  constructor() {
    if (!API_CONFIG.LASTFM_API_KEY || !API_CONFIG.BASE_URL) {
      throw new Error('Missing required LastFM configuration');
    }

    this.baseURL = API_CONFIG.BASE_URL;
    this.apiKey = API_CONFIG.LASTFM_API_KEY;
    console.log('LastFM Service initialized successfully');
  }

  async getTopTracks() {
    try {
      console.log('Fetching top tracks from LastFM...');
      const response = await axios.get(this.baseURL, {
        params: {
          method: 'chart.gettoptracks',
          api_key: this.apiKey,
          format: 'json',
          limit: 10
        }
      });

      if (!response.data?.tracks?.track) {
        console.error('Invalid response structure:', response.data);
        throw new Error('No tracks found in response');
      }

      const tracks = response.data.tracks.track.map(track => ({
        id: track.mbid || `${track.name}-${track.artist.name}`,
        name: track.name,
        artist: track.artist.name,
        image: track.image?.[2]?.['#text'] || '',
        playcount: track.playcount,
        listeners: track.listeners,
        url: track.url
      }));

      console.log(`Successfully fetched ${tracks.length} tracks`);
      return tracks;
    } catch (error) {
      console.error('Error in LastFM service:', {
        message: error.message,
        status: error.response?.status
      });
      throw new Error('Failed to fetch top tracks');
    }
  }

  async getTrackInfo(title, artist) {
    try {
      const response = await axios.get(this.baseURL, {
        params: {
          method: 'track.getInfo',
          api_key: this.apiKey,
          artist: artist,
          track: title,
          format: 'json'
        }
      });

      const trackData = response.data.track;

      return {
        name: trackData.name,
        artist: trackData.artist.name,
        imageUrl: trackData.album?.image?.[3]['#text'] || null,
        album: trackData.album?.title,
        duration: trackData.duration
          ? Math.floor(trackData.duration / 1000 / 60) +
          ':' +
          ((trackData.duration / 1000) % 60)
          : undefined,
        listeners: trackData.listeners,
        playcount: trackData.playcount,
        description: trackData.wiki?.summary
      };
    } catch (error) {
      console.error('Error fetching track info:', error);
      throw new Error('Failed to fetch track info');
    }
  }
}

module.exports = new LastFMService();