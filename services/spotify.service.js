const spotifyApi = require('../config/spotify.config');

class SpotifyService {
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

  async getDetailedTrackInfo(title, artist) {
    try {
      // Solo hacemos la búsqueda básica primero
      const searchQuery = `track:${title} artist:${artist}`;
      const searchResponse = await spotifyApi.search(searchQuery, ['track'], {
        limit: 1,
        market: 'US'
      });

      if (!searchResponse.body.tracks.items.length) {
        throw new Error('Track not found');
      }

      const track = searchResponse.body.tracks.items[0];

      // Retornamos solo la información básica
      return {
        track_info: {
          name: track.name,
          artist: track.artists[0].name,
          album: {
            name: track.album.name,
            release_date: track.album.release_date,
            image: track.album.images[0]?.url
          },
          preview_url: track.preview_url,
          external_url: track.external_urls.spotify
        }
      };
    } catch (error) {
      console.error('Error getting track info:', error);
      throw new Error(`Failed to get track info: ${error.message}`);
    }
  }


}

module.exports = new SpotifyService();