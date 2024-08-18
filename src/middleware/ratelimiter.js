import { RateLimiterMemory } from 'rate-limiter-flexible';
import { TooManyRequestsError } from '../utils/errors.js';

const rateLimiterMem = new RateLimiterMemory({
  points: 20, 
  duration: 60 
});

const rateLimiter = async(req, res, next) => {
  try {
    await rateLimiterMem.consume(req.ip);
    next();
  } catch (err) {
    return next(new TooManyRequestsError("You are limited to 20 requests per minute. Please try again later."));
  }
}

export default rateLimiter;