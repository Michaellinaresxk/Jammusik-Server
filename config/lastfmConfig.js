require('dotenv').config();

const API_CONFIG = {
  LASTFM_API_KEY: process.env.LASTFM_API_KEY,
  BASE_URL: process.env.BASE_URL
};

module.exports = { API_CONFIG };