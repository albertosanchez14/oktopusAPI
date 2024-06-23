const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const { google } = require("googleapis");
const { addAcount } = require("../middleware/OAuth2ClientManager");
const asyncHandler = require("express-async-handler");

// @desc Login
// @route POST /auth
// @access Public
const login = asyncHandler(async (req, res) => {
  // Get username and password from request body
  const { username, password } = req.body;
  // Confirm data
  if (!username || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }
  // Find user in MongoDB
  const foundUser = await User.findOne({ username }).exec();
  if (!foundUser) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  // Compare password
  const match = await bcrypt.compare(password, foundUser.password);
  if (!match) return res.status(401).json({ message: "Incorrect password" });

  // Create tokens
  const accessToken = jwt.sign(
    {
      UserInfo: {
        username: foundUser.username,
      },
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" }
  );
  const refreshToken = jwt.sign(
    { username: foundUser.username },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );
  // Create secure cookie with refresh token
  res.cookie("jwt", refreshToken, {
    httpOnly: true, //accessible only by web server
    secure: true, //https
    sameSite: "None", //cross-site cookie
    maxAge: 7 * 24 * 60 * 60 * 1000, //cookie expiry: set to match rT
  });
  // Send accessToken
  res.json({ accessToken });
});

// @desc Refresh
// @route GET /auth/refresh
// @access Public - because access token has expired
const refresh = (req, res) => {
  // Get refresh token from cookie
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.status(401).json({ message: "Unauthorized" });
  const refreshToken = cookies.jwt;
  // Verify refresh token
  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    asyncHandler(async (err, decoded) => {
      // If invalid, return 403 Forbidden
      if (err) return res.status(403).json({ message: "Forbidden" });
      // Find user in MongoDB
      const foundUser = await User.findOne({
        username: decoded.username,
      }).exec();
      if (!foundUser) return res.status(401).json({ message: "Unauthorized" });
      // Create new access token
      const accessToken = jwt.sign(
        {
          UserInfo: {
            username: foundUser.username,
          },
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "15m" }
      );
      // Send new accessToken
      res.json({ accessToken });
    })
  );
};

// @desc Logout
// @route POST /auth/logout
// @access Public - just to clear cookie if exists
const logout = (req, res) => {
  // Check for cookie
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(204); //No content
  // Clear cookie
  res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true });
  res.json({ message: "Cookie cleared" });
};

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);
// @desc Google OAuth login
// @route GET /auth/google
// @access Public
const googleLogin = asyncHandler(async (req, res) => {
  // Generate URL for Google OAuth
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/drive",
    ],
  });
  res.redirect(url);
});

// @desc Google OAuth redirect
// @route GET /auth/google/redirect
// @access Public
const googleRedirect = asyncHandler(async (req, res) => {
  // Get code from query
  const { code } = req.query;
  // Get tokens from code
  const { tokens } = await oauth2Client.getToken(code);
  // Set credentials
  oauth2Client.setCredentials(tokens);
  // Get user info
  const oauth2 = google.oauth2({ version: "v3", auth: oauth2Client });
  const userInfo = await oauth2.userinfo.get();
  
  // Get refresh token from cookie
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.status(401).json({ message: "Unauthorized" });
  const refreshToken = cookies.jwt;
  // Verify refresh token
  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    asyncHandler(async (err, decoded) => {
      // If invalid, return 403 Forbidden
      if (err) return res.status(403).json({ message: "Forbidden" });
      // Find user in MongoDB
      const foundUser = await User.findOne({
        username: decoded.username,
      }).exec();
      if (!foundUser) return res.status(401).json({ message: "Unauthorized" });
      // Save tokens to user
      const savedTokens = { username: userInfo.name, email: email, ...tokens };
      try {
        foundUser.tokens.push(savedTokens);
        await foundUser.save();
      }
      catch (error) {
        console.error(error);
        return res.status(400).json({ message: "Error saving tokens" });
      }
    })
  );
  
  // Add account to OAuth2ClientManager
  // TODO: delete this in final implementation
  addAcount(tokens);
  //
  res.json({ message: "You are now authenticated with Google" });
});

module.exports = {
  login,
  refresh,
  logout,
  googleLogin,
  googleRedirect,
};
