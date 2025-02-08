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

      // For each album, we obtain additional details
      const releasesWithDetails = await Promise.all(
        response.body.albums.items.map(async (album) => {
          try {
            // Get the tracks of the album to get the details
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
      // Clean and normalize the search terms
      const cleanTitle = title.trim().toLowerCase();
      const cleanArtist = artist.trim().toLowerCase();

      // Build a more specific query
      const searchQuery = `track:"${cleanTitle}" artist:"${cleanArtist}"`;

      const searchResponse = await spotifyApi.search(searchQuery, ['track'], {
        limit: 10,
        market: 'US'
      });

      if (!searchResponse.body.tracks.items.length) {
        throw new Error('Track not found');
      }

      // We filter to find the most exact match.
      const tracks = searchResponse.body.tracks.items;
      const exactMatch = tracks.find(track =>
        track.name.toLowerCase().includes(cleanTitle) &&
        track.artists.some(a => a.name.toLowerCase().includes(cleanArtist))
      );

      // If there is no exact match, we use the first result
      const track = exactMatch || tracks[0];

      // Additional match check
      const matchScore = {
        titleMatch: track.name.toLowerCase().includes(cleanTitle),
        artistMatch: track.artists.some(a => a.name.toLowerCase().includes(cleanArtist))
      };

      console.log('Match details:', {
        searchedTitle: cleanTitle,
        searchedArtist: cleanArtist,
        foundTitle: track.name,
        foundArtist: track.artists[0].name,
        matchScore
      });

      return {
        track_info: {
          name: track.name,
          artist: track.artists[0].name,
          album: {
            name: track.album.name,
            release_date: track.album.release_date,
            image: track.album.images[0]?.url,
            type: track.album.album_type
          },
          preview_url: track.preview_url,
          external_url: track.external_urls.spotify,
          id: track.id,
          popularity: track.popularity,
          explicit: track.explicit
        }
      };
    } catch (error) {
      console.error('Error getting track info:', error);
      throw new Error(`Failed to get track info: ${error.message}`);
    }

  }
}
module.exports = new SpotifyService();