const express = require("express");
const path = require("path");
const Photo = require("../db/photoModel");
const User = require("../db/userModel");
const router = express.Router();
const authJwt = require("./../utils/authJwt");
const { getUserIDFromToken } = require("../utils/jwtUtils");

router.get("/", async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader.split(" ")[1];
  const uid = getUserIDFromToken(token).userId;
  console.log(uid);
});

router.get("/:photo_id", async (req, res) => {
  try {
    const { photo_id } = req.params;

    // Tìm ảnh và populate luôn thông tin user trong comment
    const photo = await Photo.findById({ _id: photo_id }).populate({
      path: "comments.user_id", // Đường dẫn tới field chứa ID user trong comment
      model: "Users", // Tên Model User (check lại xem là 'User' hay 'Users')
      select: "_id first_name last_name location occupation", // Chỉ lấy trường cần thiết
    });

    if (!photo) {
      return res.status(404).json({ message: "Photo not found" });
    }

    // Trả về mảng comments đã được populate
    res.json(photo.comments);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.post("/commentsOfPhoto/:photo_id", async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader.split(" ")[1];
  const uid = getUserIDFromToken(token).userId;
  const { comment } = req.body;
  const { photo_id } = req.params;
  const cmt = { user_id: uid, comment: comment };
  try {
    const photo = await Photo.findById(photo_id);
    if (!photo) {
      return res.status(404).json({ message: "Photo not found" });
    }
    photo.comments.push(cmt);
    await photo.save();
    return res.status(201).json(cmt);
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
});

router.get("/commentsOfUser/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    const photos = await Photo.find({ "comments.user_id": userId })
      .select("file_name user_id comments date_time")
      .lean();

    let userComments = [];
    photos.forEach((photo) => {
      photo.comments.forEach((comment) => {
        if (comment.user_id.toString() === userId) {
          userComments.push({
            _id: comment._id,
            comment: comment.comment,
            date_time: comment.date_time,
            photo_id: photo._id,
            photo_owner_id: photo.user_id,
            file_name: photo.file_name,
          });
        }
      });
    });
    if (userComments.length === 0) {
      // Tùy chọn: Có thể trả về mảng rỗng 200 OK hoặc 404
      return res.status(200).json([]);
    }

    res.status(200).json(userComments);
  } catch (error) {}
});

router.delete("/", async (req, res) => {
  const { photo_id, cmt_id } = req.body;
  const photo = await Photo.findById(photo_id);
  if (!photo) {
    return res.status(404).json({ message: "Photo not found" });
  }
  const comment = photo.comments.id(cmt_id);
  if (!comment) {
    return res.status(404).json({ message: "Comment not found" });
  }
  comment.deleteOne();
  await photo.save();
  res.json({ message: "Comment deleted successfully" });
});

router.put("/edit/:cmtId", async (req, res) => {
  const cmtId = req.params.cmtId;
  const { photo_id, comment } = req.body;
  try {
    const updatedPhoto = await Photo.findOneAndUpdate({
      _id:photo_id,
      "comments._id":cmtId,
    },{
      $set:{
        "comments.$.comment":comment
      }
    },{new:true});

    if (!updatedPhoto) {
      return res.status(404).json({ message: "Photo or Comment not found" });
    }

    res.status(200).json(updatedPhoto);
  } catch (error) {
    res.status(500).json({ message: "Update commnent failed" });
  }
});

module.exports = router;
