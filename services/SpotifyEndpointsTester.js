class SpotifyEndpointsTester {
  constructor(spotifyApi) {
    this.spotifyApi = spotifyApi;
  }

  async testEndpoint(name, testFunction) {
    try {
      await testFunction();
      console.log(`✅ ${name}: Working`);
      return { name, status: 'working' };
    } catch (error) {
      console.log(`❌ ${name}: Failed - ${error.message}`);
      return { name, status: 'failed', error: error.message };
    }
  }

  async testAllEndpoints() {
    const results = await Promise.all([
      // Browse endpoints
      this.testEndpoint('Browse - New Releases', () =>
        this.spotifyApi.getNewReleases({ limit: 1 })),

      this.testEndpoint('Browse - Featured Playlists', () =>
        this.spotifyApi.getFeaturedPlaylists({ limit: 1 })),

      this.testEndpoint('Browse - Categories', () =>
        this.spotifyApi.getCategories({ limit: 1 })),

      // Search endpoints
      this.testEndpoint('Search', () =>
        this.spotifyApi.search('test', ['track', 'artist'], { limit: 1 })),

      // Albums endpoints
      this.testEndpoint('Albums - Get Album', async () => {
        const releases = await this.spotifyApi.getNewReleases({ limit: 1 });
        const albumId = releases.body.albums.items[0].id;
        return this.spotifyApi.getAlbum(albumId);
      }),

      // Artists endpoints
      this.testEndpoint('Artists - Get Artist', async () => {
        const search = await this.spotifyApi.search('Taylor Swift', ['artist'], { limit: 1 });
        const artistId = search.body.artists.items[0].id;
        return this.spotifyApi.getArtist(artistId);
      }),

      // Tracks endpoints
      this.testEndpoint('Tracks - Get Track', async () => {
        const search = await this.spotifyApi.search('Shape of You', ['track'], { limit: 1 });
        const trackId = search.body.tracks.items[0].id;
        return this.spotifyApi.getTrack(trackId);
      }),

      this.testEndpoint('Tracks - Audio Features', async () => {
        const search = await this.spotifyApi.search('Shape of You', ['track'], { limit: 1 });
        const trackId = search.body.tracks.items[0].id;
        return this.spotifyApi.getAudioFeaturesForTrack(trackId);
      }),

      // Recommendations endpoints
      this.testEndpoint('Recommendations', async () => {
        const search = await this.spotifyApi.search('Ed Sheeran', ['artist'], { limit: 1 });
        const artistId = search.body.artists.items[0].id;
        return this.spotifyApi.getRecommendations({
          seed_artists: [artistId],
          limit: 1
        });
      })
    ]);

    return results;
  }
}

module.exports = SpotifyEndpointsTester;