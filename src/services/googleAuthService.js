const { google } = require("googleapis");

const { jwtVerifyPromise } = require("../middleware/verifyJWT");
const User = require("../models/User");

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

/**
 * @desc Generate URL for Google OAuth
 * @returns {String} url
 */
async function genGoogleAuthUrl() {
  // Generate URL for Google OAuth
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/drive",
    ],
  });
  return url;
}

/**
 * @desc Get Google user information and tokens
 * @param {String} code
 * @returns {Object} userInfo
 * @returns {Object} tokens
 */
async function getGoogleUser(code) {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
  const { data } = await oauth2.userinfo.get();
  return { data, tokens };
}

/**
 * @desc Save Google credentials to database
 * @param {String} refreshToken
 * @param {Object} userData
 * @param {Object} tokens
 * @returns {String} message or redirect URL
 */
async function saveGoogleCredentials(refreshToken, userData, tokens) {
  // Verify refresh token
  const decoded = await jwtVerifyPromise(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );
  if (decoded === "Forbidden") return "Forbidden";
  // Find user in MongoDB
  const foundUser = await User.findOne({
    username: decoded.username,
  }).exec();
  if (!foundUser) return "Unauthorized";
  // Save Google credentials
  const savedTokens = {
    username: userData.name,
    email: userData.email,
    tokens,
  };
  try {
    // Check if account is already linked
    const tokenExists = foundUser.google_credentials.find(
      (google) => google.email === savedTokens.email
    );
    // If user exists and has google credentials, update credentials
    if (tokenExists) {
      const index = foundUser.google_credentials.indexOf(tokenExists);
      foundUser.google_credentials[index] = savedTokens;
      await foundUser.save();
      return "http://localhost:5173/login";
    }
    // If user exists and doesn't have google credentials, add credentials
    foundUser.google_credentials.push(savedTokens);
    await foundUser.save();
    return "http://localhost:5173/login";
  } catch (error) {
    console.error(error);
    return "Error saving tokens";
  }
}

module.exports = { genGoogleAuthUrl, getGoogleUser, saveGoogleCredentials };
