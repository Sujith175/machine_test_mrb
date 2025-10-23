const ErrorHandler = require("../Utils/ErrorHandler");

const ErrorMiddleware = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal Server Error";

  //wrong mongoDb ID
  if (err.name === "CaseError") {
    const message = `Resource not Found, Invalid ${err.path}`;
    err = new ErrorHandler(message, 400);
  }
  //duplicate key error
  if (err.statusCode === 11000) {
    const message = `Duplicate ${Object.keys(err.keyValue)} entered`;
    err = new ErrorHandler(message, 400);
  }
  //wrong jwt
  if (err.name === "JsonWebTokenError") {
    const message = `Json web token is invalid`;
    err = new ErrorHandler(message, 400);
  }
  //jwt expired error
  if (err.name === "TokenExpiredError") {
    const message = `JWT is Expired`;
    err = new ErrorHandler(message, 400);
  }

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
};

module.exports = ErrorMiddleware;
