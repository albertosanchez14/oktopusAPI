const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const User = require("../models/User");

async function checkPassword(username, password) {
  // Find user in MongoDB
  const foundUser = await User.findOne({ username }).exec();
  if (!foundUser) {
    return "User not registered";
  }
  // Compare password
  const match = await bcrypt.compare(password, foundUser.password);
  if (!match) return "Incorrect password";
  return foundUser;
}

/**
 * @desc Create access and refresh tokens
 * @param {Object} user
 * @returns {String} tokens.accessToken
 * @returns {String} tokens.refreshToken
 */
async function createTokens(user) {
  const accessToken = jwt.sign(
    {
      UserInfo: {
        username: user.username,
        email: user.email,
      },
    },
    process.env.ACCESS_TOKEN_SECRET,
    // TODO:Change to 15m in final implementation
    { expiresIn: "7d" }
  );
  const refreshToken = jwt.sign(
    {
      username: user.username,
      email: user.email,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );
  return { accessToken, refreshToken };
}

/**
 * @desc Refresh access token
 * @param {String} refreshToken
 * @returns {String} accessToken
 */
async function refreshAccessToken(refreshToken) {
  return new Promise((resolve, reject) => {
    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      async (err, decoded) => {
        if (err) return resolve("Forbidden");
        // Find user in MongoDB
        const foundUser = await User.findOne({
          username: decoded.username,
        }).exec();
        if (!foundUser) return resolve("Unauthorized");
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
        resolve(accessToken);
      }
    );
  });
}

module.exports = { createTokens, refreshAccessToken, checkPassword };
