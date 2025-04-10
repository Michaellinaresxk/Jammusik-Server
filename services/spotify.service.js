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

  async getTrackInfo(title, artist) {
    try {
      const cleanTitle = this._normalizeText(title);
      const cleanArtist = this._normalizeText(artist);
      const searchQuery = `track:"${cleanTitle}" artist:"${cleanArtist}"`;

      const searchResponse = await this.spotifyApi.search(searchQuery, ['track'], {
        limit: 20,
        market: 'US'
      });

      if (!searchResponse.body.tracks.items.length) {
        throw new Error('Track not found');
      }

      // Improved matching algorithm
      const tracks = searchResponse.body.tracks.items;
      const scoredTracks = tracks.map(track => ({
        track,
        score: this._calculateMatchScore(
          track,
          cleanTitle,
          cleanArtist
        )
      }));

      // Sort by score and get the best match
      scoredTracks.sort((a, b) => b.score - a.score);
      const bestMatch = scoredTracks[0].track;

      console.log('Match details:', {
        searchedTitle: cleanTitle,
        searchedArtist: cleanArtist,
        foundTitle: bestMatch.name,
        foundArtist: bestMatch.artists[0].name,
        matchScore: scoredTracks[0].score
      });

      return {
        track_info: {
          name: bestMatch.name,
          artist: bestMatch.artists[0].name,
          album: {
            name: bestMatch.album.name,
            release_date: bestMatch.album.release_date,
            image: bestMatch.album.images[0]?.url,
            type: bestMatch.album.album_type
          },
          preview_url: bestMatch.preview_url,
          external_url: bestMatch.external_urls.spotify,
          id: bestMatch.id,
          popularity: bestMatch.popularity,
          explicit: bestMatch.explicit
        }
      };
    } catch (error) {
      console.error('Error getting track info:', error);
      throw new Error(`Failed to get track info: ${error.message}`);
    }
  }

  // Private utility methods
  _normalizeText(text) {
    return text
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^\w\s]/g, ''); // Remove special characters
  }

  _calculateMatchScore(track, searchTitle, searchArtist) {
    let score = 0;
    const trackTitle = this._normalizeText(track.name);
    const trackArtists = track.artists.map(a => this._normalizeText(a.name));

    // Exact title match
    if (trackTitle === searchTitle) {
      score += 100;
    } else if (trackTitle.includes(searchTitle)) {
      score += 50;
    }

    // Artist match
    if (trackArtists.some(artist => artist === searchArtist)) {
      score += 100;
    } else if (trackArtists.some(artist => artist.includes(searchArtist))) {
      score += 50;
    }

    // Popularity bonus (max 20 points)
    score += (track.popularity / 100) * 20;

    return score;
  }
}

module.exports = new SpotifyService;