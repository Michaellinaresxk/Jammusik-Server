// src/services/spotify.service.js
const spotifyApi = require('../config/spotify.config');

class SpotifyService {
  async getTopTracks() {
    try {
      // En lugar de usar un playlist específico, usamos las canciones más populares
      const data = await spotifyApi.getMyTopTracks({ limit: 10 });

      if (!data.body || !data.body.items) {
        // Si no podemos obtener top tracks, usamos featured playlists como fallback
        const featured = await spotifyApi.getFeaturedPlaylists({ limit: 1, country: 'US' });
        const playlist = featured.body.playlists.items[0];
        const tracks = await spotifyApi.getPlaylistTracks(playlist.id, { limit: 10 });

        return tracks.body.items.map(item => ({
          id: item.track.id,
          name: item.track.name,
          artist: item.track.artists[0].name,
          album: item.track.album.name,
          image: item.track.album.images[0]?.url,
          preview_url: item.track.preview_url
        }));
      }

      return data.body.items.map(track => ({
        id: track.id,
        name: track.name,
        artist: track.artists[0].name,
        album: track.album.name,
        image: track.album.images[0]?.url,
        preview_url: track.preview_url
      }));
    } catch (error) {
      console.error('Error getting top tracks:', error);

      // Plan B: Obtener new releases si todo lo demás falla
      try {
        const newReleases = await spotifyApi.getNewReleases({ limit: 10, country: 'US' });
        return newReleases.body.albums.items.map(item => ({
          id: item.id,
          name: item.name,
          artist: item.artists[0].name,
          image: item.images[0]?.url,
          album: item.name,
          release_date: item.release_date,
          preview_url: item.preview_url
        }));
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
        throw new Error('Failed to fetch any tracks');
      }
    }
  }

  async getTrackDetails(trackId) {
    try {
      console.log('Getting track details for ID:', trackId);
      const track = await spotifyApi.getTrack(trackId);

      if (!track || !track.body) {
        console.error('Invalid track response:', track);
        throw new Error('Invalid track response from Spotify API');
      }

      console.log('Raw track response:', track.body);

      const trackDetails = {
        id: track.body.id,
        name: track.body.name,
        artist: track.body.artists[0]?.name || 'Unknown Artist',
        album: track.body.album?.name || 'Unknown Album',
        image: track.body.album?.images[0]?.url,
        preview_url: track.body.preview_url,
        duration_ms: track.body.duration_ms,
        popularity: track.body.popularity,
        external_url: track.body.external_urls?.spotify
      };

      console.log('Processed track details:', trackDetails);
      return trackDetails;

    } catch (error) {
      console.error('Detailed error in getTrackDetails:', {
        trackId,
        errorMessage: error.message,
        errorStack: error.stack,
        spotifyError: error.body // Si es un error de la API de Spotify
      });

      throw new Error(`Failed to fetch track details: ${error.message}`);
    }
  }

  async searchTracks(query) {
    try {
      const data = await spotifyApi.searchTracks(query, { limit: 10 });
      return data.body.tracks.items.map(track => ({
        id: track.id,
        name: track.name,
        artist: track.artists[0].name,
        album: track.album.name,
        image: track.album.images[0]?.url,
        preview_url: track.preview_url
      }));
    } catch (error) {
      console.error('Error searching tracks:', error);
      throw new Error('Failed to search tracks');
    }
  }

  async getNewReleases() {
    try {
      console.log('Fetching new releases from Spotify...');
      const response = await spotifyApi.getNewReleases({
        limit: 10,
        country: 'US'
      });

      console.log('Raw new releases response:', response.body);

      if (!response.body || !response.body.albums || !response.body.albums.items) {
        throw new Error('Invalid response format from Spotify API');
      }

      const releases = response.body.albums.items.map(album => ({
        id: album.id,
        name: album.name,
        artist: album.artists[0].name,
        album: album.name,
        image: album.images[0]?.url,
        release_date: album.release_date,
        external_url: album.external_urls?.spotify
      }));

      console.log('Processed releases:', releases);
      return releases;

    } catch (error) {
      console.error('Error fetching new releases:', {
        message: error.message,
        stack: error.stack,
        spotifyError: error.body
      });
      throw error;
    }
  }
}

module.exports = new SpotifyService();