const SpotifyWebApi = require('spotify-web-api-node');
require('dotenv').config();

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET
});

// Modifica la función para que sea más adecuada para serverless
const initializeSpotifyToken = async () => {
  try {
    const data = await spotifyApi.clientCredentialsGrant();
    const accessToken = data.body['access_token'];
    spotifyApi.setAccessToken(accessToken);
    console.log('✅ Spotify token obtained successfully');
    return accessToken;
  } catch (error) {
    console.error('❌ Error obtaining Spotify token:', error.message);
    throw error;
  } };

// Modifica el middleware para ambiente serverless
spotifyApi.ensureToken = async () => {
  if (!spotifyApi.getAccessToken()) {
    await initializeSpotifyToken();
  }
  return spotifyApi.getAccessToken();
};

module.exports = spotifyApi;