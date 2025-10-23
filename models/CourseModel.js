const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  user: Object,
  rating: {
    type: Number,
    default: 0,
  },
  comment: String,
});

const linkSchema = new mongoose.Schema({
  title: String,
  url: String,
});

const commentSchema = new mongoose.Schema({
  user: Object,
  comment: String,
  commentReplies: [Object],
});

const courseDataSchema = new mongoose.Schema({
  videoUrl: String,
  title: String,
  videoSection: String,
  description: String,
  videoLength: Number,
  links: [linkSchema],
  suggestions: String,
  questions: [commentSchema],
});

const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  estimatedPrice: {
    type: Number,
  },
  thumbnail: {
    public_id: {
      required: false,
      type: String,
    },
    url: { required: false, type: String },
  },
  tags: {
    required: true,
    type: String,
  },
  level: {
    type: String,
    required: true,
  },
  demoUrl: {
    type: String,
    required: true,
  },
  benifits: [
    {
      title: String,
    },
  ],
  prereqisites: [{ title: String }],
  reviews: [reviewSchema],
  courseData: [courseDataSchema],
  ratings: {
    type: Number,
    default: 0,
  },
  purchased: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model("Course", courseSchema);
