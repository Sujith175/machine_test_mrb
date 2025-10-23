require("dotenv").config();

const redisClient = require("./Redis");

const accessTokenExpire = parseInt(
  process.env.ACCESS_TOKEN_EXPIRES || "300",
  10
);

const refreshTokenExpire = parseInt(
  process.env.REFRESH_TOKEN_EXPIRES || "1200",
  10
);

// Set cookies with appropriate options
const accessTokenOptions = {
  expires: new Date(Date.now() + accessTokenExpire * 60 * 60 * 1000),
  maxAge: accessTokenExpire * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: "lax",
};
const refreshTokenOptions = {
  expires: new Date(Date.now() + refreshTokenExpire * 24 * 60 * 60 * 1000),
  maxAge: refreshTokenExpire * 24 * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: "lax",
};
//exporting two token options

module.exports = {
  accessTokenOptions,
  refreshTokenOptions,
};

const sendToken = (user, statusCode, res) => {
  try {
    const accessToken = user.signAccessToken();
    const refreshToken = user.signRefreshToken();

    // Store the user session in Redis
    redisClient.set(user._id.toString(), JSON.stringify(user));

    // Secure cookies in production
    if (process.env.NODE_ENV === "production") {
      accessTokenOptions.secure = true;
      refreshTokenOptions.secure = true;
    }

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
    console.error(error);
  }
};

module.exports = {
  sendToken,
};
