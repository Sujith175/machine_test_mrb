const cloudinary = require("cloudinary");
const catchAsyncErrors = require("../Middleware/CatchAsyncErrors");
const createCourse = require("../services/course.service");
const ErrorHandler = require("../Utils/ErrorHandler");
const CourseModel = require("../models/CourseModel");
const redisClient = require("../Utils/Redis");

//upload Course
const uploadCourse = catchAsyncErrors(async (req, res, next) => {
  try {
    const data = req.body;
    const thumbnail = data.thumbnail;
    if (thumbnail) {
      const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
        folder: "courses",
      });
      data.thumbnail = {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      };
    }
    createCourse(data, res, next);
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

//update course
const editCourse = catchAsyncErrors(async (req, res, next) => {
  try {
    const data = req.body;
    const thumbnail = data.thumbnail;

    if (thumbnail) {
      await cloudinary.v2.uploader.destroy(thumbnail.public_id);
      const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
        folder: "courses",
      });
      data.thumbnail = {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      };
    }
    const courseId = req.params.id;
    const course = await CourseModel.findByIdAndUpdate(
      courseId,
      {
        $set: data,
      },
      { new: true }
    );
    res.status(201).json({
      success: true,
      course,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

//get single course without purchase

const getSingleCourse = catchAsyncErrors(async (req, res, next) => {
  try {
    const courseId = req.params.id;

    if (!courseId) {
      return next(new ErrorHandler("Course ID is required", 400));
    }

    // Check if course is in the Redis cache
    const isCacheExists = await redisClient.get(courseId);

    if (isCacheExists) {
      const course = isCacheExists;

      return res.status(200).json({
        success: true,
        course,
      });
    }

    // Fetch course from the database
    const course = await CourseModel.findById(courseId).select(
      "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
    );

    if (!course) {
      return next(new ErrorHandler("Course not found", 404));
    }

    // Cache the course in Redis with an optional TTL (e.g., 3600 seconds = 1 hour)
    await redisClient.set(courseId, JSON.stringify(course), {
      EX: 3600, // Set expiry time in seconds
    });

    res.status(200).json({
      success: true,
      course,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

//get all courses without purchases

const getAllCourses = catchAsyncErrors(async (req, res, next) => {
  try {
    const isCacheExists = await redisClient.get("allCourses");
    if (isCacheExists) {
      const courses = isCacheExists;
      return res.status(200).json({ success: "true", courses });
    } else {
      const courses = await CourseModel.find().select(
        "-courseData.videoUrl -courseData.suggestion  -courseData.questions -courseData.links"
      );
      await redisClient.set("allCourses", JSON.stringify(courses));

      res.status(200).json({ success: true, courses });
    }
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

//get course content - valid user only

const getCourseByUser = catchAsyncErrors(async (req, res, next) => {
  try {
    const userCourseList = req.user?.courses;
    const courseId = req.params.id;

    const courseExists = userCourseList?.find(
      (course) => course._id.toString() === courseId
    );

    if (!courseExists) {
      return next(
        new ErrorHandler("You are not eligible to access this course", 404)
      );
    }
    const course = await CourseModel.findById(courseId);
    const content = course?.courseData;
    res.status(200).json({ success: true, content });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

module.exports = {
  uploadCourse,
  editCourse,
  getSingleCourse,
  getAllCourses,
  getCourseByUser,
};
