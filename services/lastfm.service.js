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

  async getTrackDetails(artist, trackName) {
    try {
      console.log('Fetching details for:', trackName, 'by', artist);
      const response = await axios.get(this.baseURL, {
        params: {
          method: 'track.getInfo',
          api_key: this.apiKey,
          artist: artist,
          track: trackName,
          format: 'json',
          autocorrect: 1
        }
      });

      const trackData = response.data.track;

      // Transformamos los datos para tener información más rica
      return {
        id: trackData.mbid || `${trackName}-${artist}`,
        name: trackData.name,
        artist: trackData.artist.name,
        album: trackData.album?.title,
        image: trackData.album?.image?.[3]['#text'],
        duration: trackData.duration ? this.formatDuration(trackData.duration) : undefined,
        tags: trackData.toptags?.tag?.map(tag => tag.name) || [],
        wiki: trackData.wiki?.content,
        summary: trackData.wiki?.summary,
        playcount: trackData.playcount,
        listeners: trackData.listeners,
        url: trackData.url
      };
    } catch (error) {
      console.error('Error fetching track details:', error);
      throw new Error('Failed to fetch track details');
    }
  }

  formatDuration(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}

module.exports = new LastFMService();