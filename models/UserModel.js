const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config;
const jwt = require("jsonwebtoken");

const emailRegexPattern = /^([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please Provide a Valid Name"],
    },
    email: {
      type: String,
      required: [true, "Please Enter Your Email"],
      validate: {
        validator: function (value) {
          return emailRegexPattern.test(value);
        },
        message: "Please Enter a valid Email",
      },
      unique: true,
    },
    password: {
      type: String,
      minlength: [6, "Password must be atleast 6 characters"],
      select: false,
    },
    avatar: {
      public_id: String,
      url: String,
    },
    role: {
      type: String,
      default: "user",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    courses: [
      {
        courseId: String,
      },
    ],
  },
  { timestamps: true }
);

//hash password

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
});

//sign access token
userSchema.methods.signAccessToken = function () {
  return jwt.sign({ id: this._id }, process.env.ACCESS_TOKEN || "", {
    expiresIn: "5m",
  });
};

//sign refresh token
userSchema.methods.signRefreshToken = function () {
  return jwt.sign({ id: this._id }, process.env.REFRESH_TOKEN || "", {
    expiresIn: "3d",
  });
};

//compare password

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
