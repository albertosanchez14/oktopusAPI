const jwt = require("jsonwebtoken");

const verifyJWT = (req, res, next) => {
  // Get authorization header
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  // Get token from header
  const token = authHeader.split(" ")[1];
  jwt.verify(
    token, 
    process.env.ACCESS_TOKEN_SECRET, 
    (err, decoded) => {
        if (err) return res.status(403).json({ message: "Forbidden" });
        req.username = decoded.UserInfo.username;
        req.email = decoded.UserInfo.email;
        next();
  });
};

const jwtVerifyPromise = (token, secret) => {
  return new Promise((resolve) => {
    jwt.verify(token, secret, (err, decoded) => {
      if (err) return resolve("Forbidden");
      resolve(decoded);
    });
  });
};

module.exports = { verifyJWT, jwtVerifyPromise };
