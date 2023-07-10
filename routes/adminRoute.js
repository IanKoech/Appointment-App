const express = require("express");
const router = express.Router();
const User = require("../models/userModel");
const Doctor = require("../models/doctorModel");
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/get-all-doctors", async (req, res) => {
  try {
    const doctors = await Doctor.find({});
    res.status(200).send({
      message: "Doctors fetched successfully",
      success: true,
      data: doctors,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error fetching doctors",
      success: false,
    });
  }
});

router.get("/get-all-users", async (req, res) => {
  try {
    const users = await User.find({});
    res.status(200).send({
      message: "Users fetched successfully",
      success: true,
      data: users,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error fetching users",
      success: false,
    });
  }
});

router.post(
  "/change-doctor-account-status",
  authMiddleware,
  async (req, res) => {
    try {
      const { doctorId, status, userId } = req.body;
      const doctor = await Doctor.findByIdAndUpdate(doctorId, { status });
      console.log(doctor);
      const user = await User.findOne({ _id: doctor.userId });
      const unseenNotifications = user.unseenNotifications; 
      unseenNotifications.push({
        type: "new-doctor-request-changed",
        message: `Your doctor account status changed to ${status}`,
        onClickPath: "/notifications",
      });

      user.isDoctor = status === 'approved' ? true : false;
      await user.save();

      res.status(200).send({
        message: "Doctor status update successful",
        success: true,
        data: doctor,
      });
    } catch (error) {
      console.log(error);
      res.status(500).send({
        message: "Error fetching users",
        success: false,
      });
    }
  }
);

module.exports = router;
