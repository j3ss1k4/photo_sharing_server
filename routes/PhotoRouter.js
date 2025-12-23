const express = require("express");
const Photo = require("../db/photoModel");
const router = express.Router();
const path = require("path");
const authJwt = require("./../utils/authJwt");
const upload = require("../utils/upload");
const fs = require("fs");
const { getUserIDFromToken } = require("../utils/jwtUtils");

router.get("/:id", authJwt, async (req, res) => {
  try {
    const id = req.params.id;
    let photos = await Photo.find({ user_id: id }).populate({
      path: "comments.user_id",
      model: "Users",
      select: "_id first_name last_name",
    });
    if (!photos) {
      return res.status(404).send("No photos found.");
    }
    res.json(photos);
  } catch (error) {
    console.error("Error fetching photo:", error);
    res.status(500).send(error);
  }
});

router.get("/images/:name", async (req, res) => {
  const { name } = req.params;
  const filePath = path.join(__dirname, "..", "images", name);
  try {
    res.sendFile(filePath);
  } catch (err) {
    res.status(404);
  }
});

router.post("/new", authJwt, upload.single("photo"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file upload" });
  }
  const authHeader = req.headers.authorization;
  const token = authHeader.split(" ")[1];
  const uid = getUserIDFromToken(token).userId;

  const newPhoto = new Photo({
    file_name: req.file.filename,
    user_id: uid,
    comments: [],
  });
  await newPhoto.save();
  res.json({
    message: "Upload success",
    file: {
      filename: req.file.filename,
      path: `/api/photo/images/${req.file.filename}`,
    },
  });
});

router.delete("/:photo_id", async (req, res) => {
  const { photo_id } = req.params;
  const photo = await Photo.findById(photo_id);
  if (!photo) {
    return res.status(404);
  }
  try {
    const filePath = path.join(__dirname, "..", "images", photo.file_name);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    await Photo.deleteOne({ _id: photo_id });
    res.json({
      message: "Delete successful",
    });
  } catch (err) {
    res.status(404);
  }
});
module.exports = router;
