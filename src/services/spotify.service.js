// src/services/spotify.service.js
const spotifyApi = require('../config/spotify.config');

class SpotifyService {
  async getCategories() {
    try {
      console.log('Fetching Spotify categories...');
      const response = await spotifyApi.getCategories({
        limit: 10,
        country: 'US',
        locale: 'es_ES'
      });

      if (!response?.body?.categories?.items?.length) {
        throw new Error('No categories found');
      }

      return response.body.categories.items.map(category => ({
        id: category.id,
        name: category.name,
        image: category.icons[0]?.url
      }));
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw new Error('Failed to fetch categories');
    }
  }


  async getNewReleases() {
    try {
      console.log('Fetching new releases from Spotify...');
      const response = await spotifyApi.getNewReleases({
        limit: 10,
        country: 'US'
      });

      if (!response?.body?.albums?.items?.length) {
        throw new Error('No new releases found');
      }

      // Para cada álbum, obtenemos detalles adicionales
      const releasesWithDetails = await Promise.all(
        response.body.albums.items.map(async (album) => {
          try {
            // Obtener los tracks del álbum para conseguir los detalles
            const tracksResponse = await spotifyApi.getAlbumTracks(album.id, { limit: 1 });
            const firstTrack = tracksResponse.body.items[0];

            let duration = 0;
            let popularity = 0;

            if (firstTrack) {
              const trackDetails = await spotifyApi.getTrack(firstTrack.id);
              duration = trackDetails.body.duration_ms;
              popularity = trackDetails.body.popularity;
            }

            return {
              id: album.id,
              name: album.name,
              artist: album.artists[0].name,
              album: album.name,
              image: album.images[0]?.url,
              release_date: album.release_date,
              external_url: album.external_urls?.spotify,
              duration_ms: duration,
              popularity: popularity
            };
          } catch (error) {
            console.error(`Error fetching details for album ${album.id}:`, error);
            return {
              id: album.id,
              name: album.name,
              artist: album.artists[0].name,
              album: album.name,
              image: album.images[0]?.url,
              release_date: album.release_date,
              external_url: album.external_urls?.spotify,
              duration_ms: 0,
              popularity: 0
            };
          }
        })
      );

      return releasesWithDetails;

    } catch (error) {
      console.error('Error fetching new releases:', error);
      throw new Error('Failed to fetch new releases');
    }
  }
}

module.exports = new SpotifyService();