require("dotenv").config();
const redisClient = require("./Redis");

const accessTokenExpire = parseInt(
  process.env.ACCESS_TOKEN_EXPIRES || "5", // in minutes
  10
);

const refreshTokenExpire = parseInt(
  process.env.REFRESH_TOKEN_EXPIRES || "3", // in days
  10
);

// ✅ Set correct cookie options for cross-domain (Render + React app)
const accessTokenOptions = {
  expires: new Date(Date.now() + accessTokenExpire * 60 * 1000), // 5 minutes default
  maxAge: accessTokenExpire * 60 * 1000,
  httpOnly: true,
  sameSite: "none", // ✅ Must be 'none' for cross-site cookies
  secure: true, // ✅ Render uses HTTPS → must be true
};

const refreshTokenOptions = {
  expires: new Date(Date.now() + refreshTokenExpire * 24 * 60 * 60 * 1000),
  maxAge: refreshTokenExpire * 24 * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: "none", // ✅ Required for cross-site cookies
  secure: true,
};

// ✅ Send tokens as secure cookies and store session in Redis
const sendToken = async (user, statusCode, res) => {
  try {
    const accessToken = user.signAccessToken();
    const refreshToken = user.signRefreshToken();

    // Store user session in Redis (optional for refresh)
    await redisClient.set(user._id.toString(), JSON.stringify(user));

    // Set cookies
    res.cookie("access_token", accessToken, accessTokenOptions);
    res.cookie("refresh_token", refreshToken, refreshTokenOptions);

    // Send response
    res.status(statusCode).json({
      success: true,
      user,
      accessToken,
    });
  } catch (error) {
    console.error("Error in sendToken:", error.message);
    res.status(500).json({
      success: false,
      message: "Error while sending token",
    });
  }
};

module.exports = {
  sendToken,
  accessTokenOptions,
  refreshTokenOptions,
};
