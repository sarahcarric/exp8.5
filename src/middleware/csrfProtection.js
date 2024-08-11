import { InvalidAntiCsrfTokenError } from '../errors';

export const csrfProtection = (req, res, next) => {
  const antiCsrfToken = req.headers['x-anti-csrf-token'];

  if (!antiCsrfToken) {
    return next(new InvalidCsrfTokenError("Anti-CSRF token is missing"));
  }

  if (antiCsrfToken !== req.session.antiCsrfToken) {
    return next(new InvalidAntiCsrfTokenError("Invalid Anti-CSRF token"));
  }

  next();
};