const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY is required');
}


const anthropicApi = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
module.exports = { anthropicApi };
