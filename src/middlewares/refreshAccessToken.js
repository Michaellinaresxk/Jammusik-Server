const refreshAccessToken = async () => {
  try {
    const data = await spotifyApi.refreshAccessToken();
    const accessToken = data.body['access_token'];
    spotifyApi.setAccessToken(accessToken);
    return true;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return false;
  }
};