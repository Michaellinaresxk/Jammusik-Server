const SpotifyWebApi = require('spotify-web-api-node');
require('dotenv').config();

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET
});

const initializeSpotifyToken = async () => {
  try {
    const data = await spotifyApi.clientCredentialsGrant();
    const accessToken = data.body['access_token'];
    spotifyApi.setAccessToken(accessToken);
    console.log('✅ Spotify token obtained successfully');

    // Renew token before it expires
    const refreshTimeMs = (data.body['expires_in'] - 60) * 1000;
    setTimeout(initializeSpotifyToken, refreshTimeMs);

    return accessToken;
  } catch (error) {
    console.error('❌ Error obtaining Spotify token:', error.message);
    // Retry in 5 seconds
    setTimeout(initializeSpotifyToken, 5000);
    return null;
  }
};

// Initialize token immediately
initializeSpotifyToken();

// Middleware to ensure that we have a valid token
spotifyApi.ensureToken = async () => {
  try {
    if (!spotifyApi.getAccessToken()) {
      console.log('No access token found, initializing...');
      await initializeSpotifyToken();
    }

    // Verificar si el token actual es válido
    try {
      await spotifyApi.getMe();
    } catch (error) {
      console.log('Token validation failed, refreshing...');
      await initializeSpotifyToken();
    }

  } catch (error) {
    console.error('Error in ensureToken:', error);
    throw error;
  }
};

module.exports = spotifyApi;