const express = require("express");
const User = require("../db/userModel");
const router = express.Router();
const path = require("path");
const { signToken } = require("../utils/jwtUtils");

router.post("/login", async (req, res) => {
    const {login_name, passwd} = req.body;
    const user = await User.findOne({ login_name: login_name,passwd:passwd });
    if (!user) {
      return res.status(401).send("INVALID CREDENTIALS.");
    }   
    const token = signToken({
        id: user._id,
        username:user.first_name,
    })
    return res.json({token,user});
});

router.post("/logout", (req, res) => {
    console.log("POST /api/admin/logout");
    return res.json({ status: "OK", message: "Logout successful" });
  });

router.post("/register", async(req, res) => {
    const data = req.body;
    const user = await User.findOne({login_name:data.login_name});
    if(user){
        return res.status(401).send("User already exists.")
    }
    const newUser = new User(data);
    await newUser.save();
    return res.status(200).send({message: "Registration successful" });
  });
module.exports = router;
