const jwt = require("jsonwebtoken");

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

module.exports = { createTokens };
