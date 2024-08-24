/*************************************************************************
 * @file includeSessionInResponse.js
 * @desc Middleware to include the session object in a route response
 *       for testing purposes
 * @exports exposeSession
 *************************************************************************/

/*************************************************************************
 * @function includeSessionInResponse
 * @desc Includes the session object in a route response.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 *************************************************************************/
const includeSessionInResponse = (req, res, next) => {
  console.log("In includeSessionInResponse. req.session:", JSON.stringify(req.session));
  const originalSend = res.send;
  res.send = function (body) {
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }
    body.session = req.session;
    originalSend.call(this, JSON.stringify(body));
  };
  next();
};

export default includeSessionInResponse;