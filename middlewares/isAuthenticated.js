const User = require("../models/User");
const isAuthenticated = async (req, res, next) => {
  // console.log(req.headers);
  try {
    const { authorization } = req.headers;

    if (!authorization) {
      return res.status(401).json({ message: "Unauthorized" });
    } else {
      const token = authorization.replace("Bearer ", "");
      // console.log(token);

      const findUser = await User.findOne({ token: token }).select("email, account");
      // console.log(findUser);

      if (!findUser) {
        res.status(401).json({ message: "Unauthorized" });
      } else {
        req.user = findUser;
      }
      next();
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = isAuthenticated;
