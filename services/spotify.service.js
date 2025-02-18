const spotifyApi = require('../config/spotify.config');
const CacheService = require('./cache.service');

class SpotifyService {
  constructor() {
    this.spotifyApi = spotifyApi;
    // Reducir el tiempo de caché a 24 horas para verificar más frecuentemente
    this.cacheService = new CacheService(24 * 60 * 60 * 1000); // 24 horas
    this.CACHE_KEY = 'new_releases';
  }

  async getNewReleases(forceRefresh = false) {
    try {
      // Verificar si hay datos en caché y si no está forzando refresh
      if (!forceRefresh) {
        const cachedData = this.cacheService.get(this.CACHE_KEY);
        if (cachedData) {
          // Verificar si los datos en caché son de hoy
          const isCacheFromToday = this._isFromToday(cachedData[0]?.release_date);
          if (isCacheFromToday) {
            console.log('Returning today\'s cached releases...');
            return cachedData;
          }
        }
      }

      console.log('Fetching new releases from Spotify...');
      const response = await this.spotifyApi.getNewReleases({
        limit: 10,
        country: 'US'
      });

      if (!response?.body?.albums?.items?.length) {
        throw new Error('No new releases found');
      }

      const releasesWithDetails = await Promise.all(
        response.body.albums.items.map(async (album) => {
          try {
            const tracksResponse = await this.spotifyApi.getAlbumTracks(album.id, { limit: 1 });
            const firstTrack = tracksResponse.body.items[0];

            let trackDetails = null;
            if (firstTrack) {
              trackDetails = await this.spotifyApi.getTrack(firstTrack.id);
            }

            return {
              id: album.id,
              name: album.name,
              artist: album.artists[0].name,
              album: album.name,
              image: album.images[0]?.url,
              release_date: album.release_date,
              external_url: trackDetails?.body?.external_urls?.spotify || album.external_urls?.spotify,
              track_id: trackDetails?.body?.id,
              duration_ms: trackDetails?.body?.duration_ms || 0,
              popularity: trackDetails?.body?.popularity || 0,
              preview_url: trackDetails?.body?.preview_url,
              cached_at: new Date().toISOString()
            };
          } catch (error) {
            console.error(`Error fetching details for album ${album.id}:`, error);
            return null;
          }
        })
      );

      // Filtrar releases nulos y ordenar por fecha de lanzamiento
      const validReleases = releasesWithDetails
        .filter(release => release !== null)
        .sort((a, b) => new Date(b.release_date) - new Date(a.release_date));

      // Actualizar caché solo si hay nuevos datos válidos
      if (validReleases.length > 0) {
        this.cacheService.set(this.CACHE_KEY, validReleases);
      }

      return validReleases;

    } catch (error) {
      console.error('Error fetching new releases:', error);

      // Intentar usar caché como fallback
      const cachedData = this.cacheService.get(this.CACHE_KEY);
      if (cachedData) {
        console.log('Returning cached data as fallback...');
        return cachedData;
      }

      throw error;
    }
  }

  // Método auxiliar para verificar si una fecha es de hoy
  _isFromToday(dateString) {
    if (!dateString) return false;
    const today = new Date();
    const date = new Date(dateString);
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }
}

module.exports = new SpotifyService();