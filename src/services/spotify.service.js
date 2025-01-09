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
          release_date: item.release_date
        }));
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
        throw new Error('Failed to fetch any tracks');
      }
    }
  }

  async getTrackDetails(trackId) {
    try {
      const track = await spotifyApi.getTrack(trackId);
      return {
        id: track.body.id,
        name: track.body.name,
        artist: track.body.artists[0].name,
        album: track.body.album.name,
        image: track.body.album.images[0]?.url,
        preview_url: track.body.preview_url,
        duration_ms: track.body.duration_ms,
        popularity: track.body.popularity,
        external_url: track.body.external_urls.spotify
      };
    } catch (error) {
      console.error('Error getting track details:', error);
      throw new Error('Failed to fetch track details');
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
}

module.exports = new SpotifyService();