const catchAsyncError = require("../Middleware/CatchAsyncErrors");
const CourseModel = require("../models/CourseModel");

const createCourse = catchAsyncError(async (data, res) => {
  const course = await CourseModel.create(data);
  res.status(201).json({ success: true, course });
});

module.exports = createCourse;
