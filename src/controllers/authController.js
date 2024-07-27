import passport from 'passport';

export const githubAuth = passport.authenticate('github', { scope: ['user:email', 'read:user'] });

export const githubCallback = (req, res, next) => {
  passport.authenticate('github', (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Authentication failed', message: err.message});
    }
    if (!user) {
      return res.status(401).json({error: 'Login failed. No user found' });
    }
    req.user = user;
    res.status(200).send(`User logged in successfully: ${req.user.accountInfo.email}`);
  })(req, res, next);
};