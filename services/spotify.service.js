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

      const releasesWithDetails = await Promise.all(
        response.body.albums.items.map(async (album) => {
          try {
            const tracksResponse = await spotifyApi.getAlbumTracks(album.id, { limit: 1 });
            const firstTrack = tracksResponse.body.items[0];

            let trackDetails = null;
            if (firstTrack) {
              trackDetails = await spotifyApi.getTrack(firstTrack.id);
            }

            return {
              id: album.id,
              name: album.name,
              artist: album.artists[0].name,
              album: album.name,
              image: album.images[0]?.url,
              release_date: album.release_date,
              // Use the external_url of the specific song if available
              external_url: trackDetails?.body?.external_urls?.spotify || album.external_urls?.spotify,
              track_id: trackDetails?.body?.id,
              duration_ms: trackDetails?.body?.duration_ms || 0,
              popularity: trackDetails?.body?.popularity || 0,
              preview_url: trackDetails?.body?.preview_url
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
              track_id: null,
              duration_ms: 0,
              popularity: 0,
              preview_url: null
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
      const cleanTitle = this._normalizeText(title);
      const cleanArtist = this._normalizeText(artist);
      const searchQuery = `track:"${cleanTitle}" artist:"${cleanArtist}"`;

      const searchResponse = await spotifyApi.search(searchQuery, ['track'], {
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

module.exports = new SpotifyService();