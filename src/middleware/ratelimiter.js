import { RateLimiterMemory } from 'rate-limiter-flexible';
import { TooManyRequestsError } from '../utils/errors.js';

const rateLimiterMem = new RateLimiterMemory({
  points: 1000, 
  duration: 3600 //1000 requests/hour
});

const rateLimiter = async(req, res, next) => {
  try {
    await rateLimiterMem.consume(req.ip);
    next();
  } catch (err) {
    return next(new TooManyRequestsError());
  }
}

export default rateLimiter;