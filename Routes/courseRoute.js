const express = require("express");
const {
  uploadCourse,
  editCourse,
  getSingleCourse,
  getAllCourses,
  getCourseByUser,
} = require("../controllers/course");
const isAuthenticated = require("../Middleware/auth");
const { authorizeRoles } = require("../controllers/user");
const router = express.Router();

router.post(
  "/create-course",
  isAuthenticated,
  authorizeRoles("admin"),
  uploadCourse
);
router.put(
  "/edit-course/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  editCourse
);

router.get("/get-course/:id", getSingleCourse);
router.get("/get-courses", getAllCourses);

router.get("/get-course-content/:id", isAuthenticated, getCourseByUser);

module.exports = router;
