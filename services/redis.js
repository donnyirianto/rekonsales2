import redis from 'redis'; 
import {config} from '../config/config.js';
import { logger } from '../config/logger.js';

export const client = redis.createClient({
    password: config.redis.pass,
    socket: {
        host: config.redis.host,
        port: config.redis.port
    }
});

client.on('error', (err) => {
  logger.info(`Redis connection error: ${err}`);
  });

client.on('connect', () => { 
  logger.info(`Connected to Redis server`);
});

client.on('ready', () => {
  logger.info(`Redis Server - Ready`);
});

client.on('reconnecting', () => {
  logger.info(`ReConnecting to Redis server`);
});

client.on('end', () => {
  logger.info(`Redis server Disconnect`);
});

client.connect()