const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('ANTHROPIC_API_KEY is not defined in environment variables');
}
const anthropicApi = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
module.exports = { anthropicApi };