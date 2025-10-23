const ErrorHandler = require("../Utils/ErrorHandler");
const redisClient = require("../Utils/Redis");
const catchAsyncError = require("./CatchAsyncErrors");
const jwt = require("jsonwebtoken");

//user authenticated
const isAuthenticated = catchAsyncError(async (req, res, next) => {
  const access_token = req.cookies.access_token;

  if (!access_token) {
    return next(new ErrorHandler("please login to continue", 400));
  }

  const decoded = jwt.verify(access_token, process.env.ACCESS_TOKEN);

  if (!decoded) {
    return next(new ErrorHandler("your access credientials is not valid", 400));
  }

  const user = await redisClient.get(decoded.id);

  if (!user) {
    return next(new ErrorHandler("user not found", 400));
  }
  req.user = user;
  next();
});

module.exports = isAuthenticated;
