const sendMail = require("../Utils/sendMail");
//AdcjAAIncDEzZjM3ZGVmOTdjZjk0Y2ZhODkyNjMwMGE4NzIwMTdkNnAxNTUwNzU
const User = require("../models/UserModel");
const catchAsyncError = require("../Middleware/CatchAsyncErrors");
const ErrorHandler = require("../Utils/ErrorHandler");
const jwt = require("jsonwebtoken");
//register user
const ejs = require("ejs");
const path = require("path");
const UserModel = require("../models/UserModel");
const {
  sendToken,
  accessTokenOptions,
  refreshTokenOptions,
} = require("../Utils/jwt");
const redisClient = require("../Utils/Redis");
const { getUserById } = require("../services/user.service");
const cloudinary = require("cloudinary");

require("dotenv").config();

const registerUser = catchAsyncError(async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const isEmailExists = await User.findOne({ email });
    if (isEmailExists) {
      return next(new ErrorHandler("Email Already Exits", 400));
    }
    const user = {
      name,
      email,
      password,
    };
    const activationToken = createActivationToken(user);

    const activationCode = activationToken.activationCode;
    const data = { user: { name: user.name }, activationCode };
    const html = await ejs.renderFile(
      path.join(__dirname, "../Mails/Activation-mail.ejs"),
      data
    );
    try {
      await sendMail({
        email: user.email,
        subject: "Activate your account",
        template: "Activation-mail.ejs",
        data,
      });

      res.status(201).json({
        success: true,
        message: `Please Check Your Email ${user.email} to activate your account`,
        activationToken: activationToken.token,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 400));
    }
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

function createActivationToken(user) {
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString();

  const token = jwt.sign(
    {
      user,
      activationCode,
    },
    process.env.ACTIVATION_SECRET,
    {
      expiresIn: "5m",
    }
  );
  return { token, activationCode };
}

//activate user
const activateUser = catchAsyncError(async (req, res, next) => {
  try {
    const { activationToken, activationCode } = req.body;

    const newUser = jwt.verify(activationToken, process.env.ACTIVATION_SECRET);

    if (newUser.activationCode !== activationCode) {
      return next(new ErrorHandler("Invalid Activation Code", 400));
    }
    const { name, email, password } = newUser.user;
    const existUser = await User.findOne({ email });
    if (existUser) {
      return next(new ErrorHandler("User already exists", 400));
    }
    const user = await User.create({
      name,
      email,
      password,
    });
    res.status(201).json({ success: true, user });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

//login user

const loginUser = catchAsyncError(async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(new ErrorHandler("Invalid Credentials", 400));
    }
    const user = await UserModel.findOne({ email }).select("+password");
    console.log(user._id);

    if (!user) {
      return next(new ErrorHandler("Invalid Credentials", 400));
    }
    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      return next(new ErrorHandler("Invalid Credentials", 400));
    }
    sendToken(user, 200, res);
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

//logout user
const logoutUser = catchAsyncError(async (req, res, next) => {
  console.log("hi");

  try {
    res.cookie("access_token", "", { maxAge: 1 });
    res.cookie("refresh_token", "", { maxAge: 1 });

    const userId = req.user._id;

    await redisClient.del(userId);

    res
      .status(200)
      .json({ success: true, msg: "user logged out successfully" });
  } catch (error) {
    return next(new ErrorHandler(error));
  }
});

//validate user roles

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role || "")) {
      return next(
        new ErrorHandler(
          `Role : ${req.user?.role} is not allowed to access this resource`,
          403
        )
      );
    }
    next();
  };
};

//update access token

const updateAccessToken = catchAsyncError(async (req, res, next) => {
  try {
    const refresh_token = req.cookies.refresh_token;

    const decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN);

    if (!decoded) {
      return next(new ErrorHandler("Unable to refresh token", 400));
    }

    const session = await redisClient.get(decoded.id);

    if (!session) {
      return next(new ErrorHandler("Unable to refresh token", 400));
    }
    // console.log(session);

    // const user = JSON.parse({ session });

    const accessToken = jwt.sign(
      { id: session._id }, // Use `user._id` here
      process.env.ACCESS_TOKEN,
      {
        expiresIn: "5m",
      }
    );

    const refreshToken = jwt.sign(
      { id: session._id }, // Use `user._id` here
      process.env.REFRESH_TOKEN,
      {
        expiresIn: "3d",
      }
    );

    req.user = session;

    res.cookie("access_token", accessToken, accessTokenOptions);
    res.cookie("refresh_token", refreshToken, refreshTokenOptions);
    res.status(200).json({
      status: "success",
      accessToken,
    });
  } catch (error) {
    next(new ErrorHandler(error.message, 400));
  }
});

//get user info
const getUserInfo = catchAsyncError(async (req, res, next) => {
  try {
    const userId = req.user?._id;
    getUserById(userId, res);
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

//social auth

const socialAuth = catchAsyncError(async (req, res, next) => {
  try {
    const { email, name, avatar } = req.body;
    const user = await UserModel.findOne({ email });
    if (!user) {
      const newUser = await UserModel.create({ email, name, avatar });
      sendToken(newUser, 200, res);
    } else {
      sendToken(user, 200, res);
    }
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

//update user info

const updateUserInfo = catchAsyncError(async (req, res, next) => {
  try {
    const { name, email } = req.body;

    const userId = req.user?._id;

    // Fetch the user by ID
    const user = await UserModel.findById(userId);

    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    // Check if email exists and is not the same as the current user's email
    if (email && email !== user.email) {
      const isEmailExists = await UserModel.findOne({ email });

      if (isEmailExists) {
        return next(new ErrorHandler("Email already exists", 400));
      }

      user.email = email;
    }

    // Update the name if provided
    if (name) {
      user.name = name;
    }

    // Save the updated user information
    await user.save();

    // Update the user information in Redis
    await redisClient.set(userId, JSON.stringify(user)); // Save the plain object

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(new ErrorHandler(error.message, 400));
  }
});

//update user password

const updatePassword = catchAsyncError(async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (oldPassword === newPassword) {
      return next(
        new ErrorHandler("new Password can't be same as old password", 400)
      );
    }

    if (!oldPassword || !newPassword) {
      return next(
        new ErrorHandler("Please Enter Your old and new Password", 400)
      );
    }

    const user = await User.findById(req.user?._id).select("+password");

    console.log(user);

    if (user?.password === undefined) {
      return next(new ErrorHandler("Invalid User", 400));
    }

    const isPasswordValid = await user.comparePassword(oldPassword);

    if (!isPasswordValid) {
      return next(new ErrorHandler("Please Check your old Password", 400));
    }

    user.password = newPassword;
    await user.save();

    await redisClient.set(req.user._id, JSON.stringify(user));

    res.status(201).json({ success: true, user });
  } catch (error) {
    next(new ErrorHandler(error.message, 400));
  }
});

//update profile picture

const updateProfilePicture = catchAsyncError(async (req, res, next) => {
  try {
    const { avatar } = req.body;
    const userId = await req.user?._id;
    const user = await User.findById(userId);

    if (avatar && user) {
      if (user?.avatar?.public_id) {
        await cloudinary.v2.uploader.destroy(user?.avatar?.public_id);
        const myCloud = await cloudinary.v2.uploader.upload(avatar, {
          folder: "avatars",
          width: 150,
        });
        user.avatar = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      } else {
        const myCloud = await cloudinary.v2.uploader.upload(avatar, {
          folder: "avatars",
          width: 150,
        });
        user.avatar = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }
    }
    await user?.save();
    await redisClient.set(userId, JSON.stringify(user));
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(new ErrorHandler(error.message, 400));
  }
});

module.exports = {
  registerUser,
  createActivationToken,
  activateUser,
  loginUser,
  logoutUser,
  authorizeRoles,
  updateAccessToken,
  getUserInfo,
  socialAuth,
  updateUserInfo,
  updatePassword,
  updateProfilePicture,
};
