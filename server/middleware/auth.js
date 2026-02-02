exports.isAuthenticated = (req, res, next) => {
    if (req.session.user) return next();
    return res.status(401).json({ message: 'Not authenticated' });
  };
  
  exports.isAdmin = (req, res, next) => {
    if (req.session.user?.role === 'admin' || req.session.user?.role === 'super admin') return next();
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  };

  exports.isSuperAdmin = (req, res, next) => {
    if (req.session.user?.role === 'super admin') return next();
    return res.status(403).json({ message: 'Access denied. Super Admin privileges required.' });
  };
