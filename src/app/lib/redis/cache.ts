/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import logger from "../../utils/serverTools/logger";
import redis from "./redis";

const DEFAULT_TTL = 60; // 1 min

export const setCache = async (
  key: string,
  value: unknown,
  ttl: number = DEFAULT_TTL
) => {
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttl);
    logger.debug(`Cache set: ${key} (TTL: ${ttl}s)`);
  } catch (err) {
    logger.error(`Failed to set cache for key: ${key}`, err);
  }
};

/**
 * Get value from Redis cache
 */
export const getCache = async <T>(key: string): Promise<T | null> => {
  try {
    const data = await redis.get(key);
    if (!data) {
      logger.debug(`Cache miss: ${key}`);
      return null;
    }
    logger.debug(`Cache hit: ${key}`);
    return JSON.parse(data) as T;
  } catch (err) {
    logger.error(`Failed to get cache for key: ${key}`, err);
    return null;
  }
};

/**
 * Get cached data if available, otherwise fetch fresh data and cache it
 */
export const revalidateCache = async <T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = DEFAULT_TTL
): Promise<T> => {
  const cached = await getCache<T>(key);
  if (cached) return cached;

  try {
    const freshData = await fetcher();
    await setCache(key, freshData, ttl);
    return freshData;
  } catch (err) {
    logger.error(`Failed to fetch fresh data for key: ${key}`, err);
    throw err; // Let your API handle the error
  }
};
