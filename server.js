const app = require("./index");
const connectDB = require("./Utils/Db");
const cloudinaryModule = require("cloudinary");
const cloudinary = cloudinaryModule.v2;

require("dotenv").config();

//cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_SECRET_KEY,
});

//create Server
app.listen(process.env.PORT, () => {
  console.log(`Server is connected with port ${process.env.PORT}`);
  connectDB();
});
