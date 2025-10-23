const express = require("express");
const cookirParser = require("cookie-parser");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const ErrorMiddleware = require("./Middleware/error");
const app = express();
const userRouter = require("./Routes/UserRoute");
const courseRouter = require("./Routes/courseRoute");
require("dotenv").config();

//body-parser
app.use(express.json({ limit: "50mb" }));

//cookie-parser
app.use(cookieParser());

//cors origin

app.use(
  cors({
    origin: "https://auth-mrb.onrender.com",
    credentials: true,
  })
);

//test api

app.use("/api/v1/user", userRouter);
app.use("/api/v1/course", courseRouter);

//unknown route

app.all("*", (req, res, next) => {
  const err = new Error(`Route ${req.originalUrl} not found`);
  err.statusCode = 404;
  next(err);
});

app.use(ErrorMiddleware);

module.exports = app;
