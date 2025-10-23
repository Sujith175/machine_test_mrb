const { Redis } = require("@upstash/redis"); // Use Upstash Redis package
require("dotenv").config();

// Initialize Redis client using Upstash's url and token
const redisClient = new Redis({
  url: process.env.REDIS_URL, // Fetch the Redis URL from .env
  token: process.env.REDIS_TOKEN, // Fetch the Redis token from .env
});

console.log("Redis connected at", process.env.REDIS_URL);

module.exports = redisClient;
