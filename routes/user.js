const express = require("express");
const router = express.Router();
const User = require("../models/User");
const uid2 = require("uid2");
const encBase64 = require("crypto-js/enc-base64");
const { SHA256 } = require("crypto-js");
const cloudinary = require("cloudinary").v2;
const fileUpload = require("express-fileupload");

const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

//
// SIGNUP
//
router.post("/user/signup", fileUpload(), async (req, res) => {
  try {
    const body = req.body;
    const { username, email, password, newsletter } = body;
    const files = req.files.avatar;

    //Search email in the DB
    const findUser = await User.findOne({
      "account.username": username,
    });

    //Check if username is NOT empty
    if (username) {
      // Check if username is found in DB
      if (!findUser) {
        //Create a salt, create a hash (salt + password) and encrypt it, generate a token from hash
        const salt = uid2(16);
        const hash = SHA256(salt + password).toString(encBase64);
        const token = uid2(64);

        //Create a new User object
        const newUser = new User({
          email: email,
          account: {
            username: username,
            avatar: files,
          },
          newsletter: newsletter,
          salt: salt,
          hash: hash,
          token: token,
        });

        const uploadPicture = await cloudinary.uploader.upload(
          convertToBase64(files),
          {
            folder: "/vinted/userAvatar",
            public_id: newUser._id,
          }
        );
        newUser.account.avatar = uploadPicture;

        //Save user in the DB
        await newUser.save();

        const userInfo = {
          _id: newUser._id,
          token: token,
          account: {
            username: username,
          },
        };

        res.status(201).json(userInfo);
      } else {
        res.status(400).json({ message: "Username already exists" });
      }
    } else {
      res.status(400).json({ message: "Please provide a username" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

//
// LOGIN
//
router.post("/user/login", async (req, res) => {
  try {
    const body = req.body;
    const { email, password } = body;

    if (email) {
      const findUser = await User.findOne({ email: email });
      if (findUser) {
        const hashCheck = SHA256(findUser.salt + password).toString(encBase64);

        if (findUser.hash === hashCheck) {
          //Create a response with the info
          const userInfo = {
            _id: findUser._id,
            token: findUser.token,
            account: {
              username: findUser.account.username,
            },
          };
          res.status(201).json(userInfo);
        } else {
          res.status(400).json({ message: "Unauthorised" });
        }
      } else {
        res.status(400).json({ message: "Email does not exist in DB" });
      }
    } else {
      res.status(400).json({ message: "Please provide an email" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
