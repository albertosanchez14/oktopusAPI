const asyncHandler = require("express-async-handler");

const {
  createTokens,
  refreshAccessToken,
  checkPassword,
} = require("../services/authService");
const {
  genGoogleAuthUrl,
  getGoogleUser,
  saveGoogleCredentials,
} = require("../services/googleAuthService");

/**
 * @desc Login
 * @route POST /auth
 * @access Public
 */
const login = asyncHandler(async (req, res) => {
  // Get username and password from request body
  const { username, password } = req.body;
  // Confirm data
  if (!username || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }
  // Check password
  const foundUser = await checkPassword(username, password);
  if (foundUser === "User not registered")
    return res.status(404).json({ message: foundUser });
  if (foundUser === "Incorrect password")
    return res.status(401).json({ message: foundUser });
  // Create tokens
  const { accessToken, refreshToken } = await createTokens(foundUser);
  // Create secure cookie with refresh token
  res.cookie("jwt", refreshToken, {
    httpOnly: false, //accessible only by web server
    secure: false, //https
    sameSite: "None", //cross-site cookie
    maxAge: 7 * 24 * 60 * 60 * 1000, //cookie expiry: set to match rT
  });
  // Send accessToken
  res.json({ accessToken });
});

/**
 * @desc Refresh
 * @route GET /auth/refresh
 * @access Public
 */
const refresh = asyncHandler(async (req, res) => {
  // Get refresh token from cookie
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.status(401).json({ message: "Unauthorized" });
  const refreshToken = cookies.jwt;
  // Get new access token
  const accessToken = await refreshAccessToken(refreshToken);
  // Check if token is valid
  if (accessToken === "Forbidden")
    return res.status(403).json({ message: "Forbidden" });
  if (accessToken === "Unauthorized")
    return res.status(401).json({ message: "Unauthorized" });
  // Send new access token
  res.json({ accessToken });
});

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

/**
 * @desc Google OAuth login
 * @route GET /auth/google
 * @access Private
 */
const googleLogin = asyncHandler(async (req, res) => {
  // Generate URL for Google OAuth
  const url = await genGoogleAuthUrl();
  res.redirect(url);
});

/**
 * @desc Google OAuth redirect
 * @route GET /auth/google/redirect
 * @access Private
 */
const googleRedirect = asyncHandler(async (req, res) => {
  // Get refresh token from cookie
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.status(401).json({ message: "Unauthorized" });
  const refreshToken = cookies.jwt;
  // Get code from query
  const { code } = req.query;
  // Get google user info and tokens
  const { data, tokens } = await getGoogleUser(code);
  // Save google credentials
  const result = await saveGoogleCredentials(refreshToken, data, tokens);
  // If user doesn't exist, forbidden
  if (result === "Forbidden") return res.status(403).json({ message: result });
  if (result === "Unauthorized")
    return res.status(401).json({ message: result });
  if (result === "Error saving tokens")
    return res.status(400).json({ message: result });
  console.log(result);
  // Redirect to login page
  res.redirect(result);
});

module.exports = {
  login,
  refresh,
  logout,
  googleLogin,
  googleRedirect,
};
