import { InvalidAntiCsrfTokenError } from '../utils/errors.js';

export const csrfProtection = (req, res, next) => {
  const antiCsrfToken = req.headers['x-anti-csrf-token'];

  if (!antiCsrfToken) {
    console.log("Anti-CSRF token is missing");
    return next(new InvalidAntiCsrfTokenError("Anti-CSRF token is missing"));
  }

  if (antiCsrfToken !== req.session.antiCsrfToken) {
    console.log("Invalid anti-CSRF token");
    console.log("req.session: ", JSON.stringify(req.session));
    console.log("antiCsrfToken in header: ", antiCsrfToken);
    console.log("antiCsrfToken in session: ", req.session.antiCsrfToken);
    return next(new InvalidAntiCsrfTokenError("Invalid anti-CSRF token"));
  }

  next();
};