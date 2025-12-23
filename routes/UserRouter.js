const express = require("express");
const User = require("../db/userModel");
const router = express.Router();
const authJwt = require("./../utils/authJwt");
const Photo = require("../db/photoModel");
const { getUserIDFromToken } = require("../utils/jwtUtils");

// router.get("/", async (req, res) => {
//   let users = await User.find();
//   res.json(users);
// });

router.get("/", authJwt, async (req, res) => {
  try {
    // 1. Lấy danh sách tất cả user
    // Sử dụng .lean() để trả về object JS thuần (giúp chỉnh sửa dữ liệu nhanh hơn)
    const users = await User.find({}, "_id first_name last_name").lean();

    // 2. Dùng Promise.all để tính toán số liệu cho TỪNG user song song
    const usersWithCounts = await Promise.all(
      users.map(async (user) => {
        // --- A. Đếm số lượng ảnh (Bong bóng xanh) ---
        // Đếm trong bảng Photo xem có bao nhiêu ảnh do user_id này đăng
        const photoCount = await Photo.countDocuments({ user_id: user._id });

        // --- B. Đếm số lượng comment (Bong bóng đỏ) ---
        // Bước 1: Tìm tất cả các ảnh mà có chứa comment của user này
        const photosWithComments = await Photo.find({
          "comments.user_id": user._id,
        }).select("comments"); // Chỉ lấy trường comments để tiết kiệm RAM

        // Bước 2: Duyệt qua các ảnh tìm được và đếm chính xác số comment
        let commentCount = 0;
        photosWithComments.forEach((photo) => {
          photo.comments.forEach((comment) => {
            if (comment.user_id.toString() === user._id.toString()) {
              commentCount++;
            }
          });
        });

        // --- C. Trả về object user mới kèm theo 2 số liệu ---
        return {
          ...user, // Giữ nguyên thông tin cũ (id, name...)
          photo_count: photoCount,
          comment_count: commentCount,
        };
      })
    );

    // 3. Trả về kết quả
    res.json(usersWithCounts);
  } catch (err) {
    console.error("Error fetching user list:", err);
    res.status(500).send({ message: "Server error", error: err.message });
  }
});

router.get("/:id", authJwt, async (req, res) => {
  const id = req.params.id;
  let user = await User.findOne({ _id: id });
  res.json(user);
});

router.get("/about/me", authJwt, async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader.split(" ")[1];
  const uid = getUserIDFromToken(token).userId;
  let user = await User.findOne({ _id: uid });
  res.json(user);
});

router.post("/update/me", authJwt, async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader.split(" ")[1];
  const uid = getUserIDFromToken(token).userId;
  const data = req.body;
  try {
    const updateUser = await User.findByIdAndUpdate(uid, data, { new: true });
    res.status(200).json(updateUser);
  } catch (error) {
    res.status(500).json({ message: "Update failed" });
  }
});

router.post("/edit/:userId", async (req, res) => {
  const uid = req.params.userId;
  const data = req.body;
  try {
    const updateUser = await User.findByIdAndUpdate(uid, data, { new: true });
    res.status(200).json(updateUser);
    console.log(uid + ", " + data);
  } catch (error) {
    res.status(500).json({ message: "Update failed" });
  }
});

router.delete("/:id", async (req, res) => {
  const id = req.params.id;
  let user = await User.findOne({ _id: id });
  if (!user) {
    res.status(401).send({ message: "User not found" });
  }
  const deleteUser = await User.deleteOne({ _id: id });
  res.json({ message: "Delete successfu;;" });
  // res.json(user);
});

module.exports = router;
