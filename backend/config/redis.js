const { createClient } = require("redis");

let redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
if (process.env.REDIS_URL && !process.env.REDIS_URL.startsWith('redis://') && !process.env.REDIS_URL.startsWith('rediss://')) {
    redisUrl = `redis://${process.env.REDIS_URL}`;
}

const redisClient = createClient({
    url: redisUrl
});

redisClient.on('error', (err) => console.error('Redis Client Error:', err));
redisClient.on('connect', () => console.log('Redis connected'));

const connectRedis = async () => {
    try {
        await redisClient.connect();
    } catch (err) {
        console.error("Could not connect to Redis", err);
    }
};

module.exports = { redisClient, connectRedis };
