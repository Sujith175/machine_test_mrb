//get user by id

const UserModel = require("../models/UserModel");
const redisClient = require("../Utils/Redis");

const getUserById = async (id, res) => {
  const userJson = await redisClient.get(id);

  if (userJson) {
    const user = JSON.parse(userJson);
    res.status(201).json({
      success: true,
      user,
    });
  }
};

module.exports = {
  getUserById,
};
