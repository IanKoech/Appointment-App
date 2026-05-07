import express from "express";
const router = express.Router();
import User from "../models/userModel.js";
import Doctor from "../models/doctorModel.js";
import authMiddleware from "../middlewares/authMiddleware.js";

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
    const users = await User.find({}).select("-password");
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

router.post("/update-user-status", authMiddleware, async (req, res) => {
  try {
    const { targetUserId, isActive } = req.body;
    if (typeof isActive !== "boolean") {
      return res.status(400).send({
        message: "isActive must be true or false",
        success: false,
      });
    }

    if (targetUserId === req.body.userId && !isActive) {
      return res.status(400).send({
        message: "You cannot deactivate your own admin account",
        success: false,
      });
    }

    const user = await User.findByIdAndUpdate(
      targetUserId,
      { isActive },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).send({
        message: "User not found",
        success: false,
      });
    }

    res.status(200).send({
      message: isActive ? "User reactivated" : "User deactivated",
      success: true,
      data: user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error updating user status",
      success: false,
    });
  }
});

router.post(
  "/change-doctor-account-status",
  authMiddleware,
  async (req, res) => {
    try {
      const { doctorId, status, verificationNotes } = req.body;
      const allowedStatuses = ["pending", "verified", "rejected", "expired"];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).send({
          message: "Invalid practitioner verification status",
          success: false,
        });
      }

      const update = {
        status,
        verificationNotes: verificationNotes || "",
        verifiedAt: status === "verified" ? new Date() : undefined,
        verifiedBy: req.body.userId,
      };
      const doctor = await Doctor.findByIdAndUpdate(doctorId, update, { new: true });
      if (!doctor) {
        return res.status(404).send({
          message: "Doctor not found",
          success: false,
        });
      }
      const user = await User.findOne({ _id: doctor.userId });
      if (!user) {
        return res.status(404).send({
          message: "Doctor user not found",
          success: false,
        });
      }
      const unseenNotifications = user.unseenNotifications; 
      unseenNotifications.push({
        type: "new-doctor-request-changed",
        message: `Your practitioner verification status changed to ${status}`,
        onClickPath: "/notifications",
      });

      user.isDoctor = status === 'verified' ? true : false;
      user.unseenNotifications = unseenNotifications;
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

router.post("/add-phone-number-field", authMiddleware, async (req, res) => {
  try {
    await User.updateMany({}, { $set: { phoneNumber: '' } });

    res.status(200).send({
      message: "Phone number field added to all users successfully",
      success: true,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error updating users",
      success: false,
    });
  }
});

router.post("/add-till-number", authMiddleware, async (req, res) => {
  try {
    await Doctor.updateMany({}, { $set: { tillNumber: 174379 } });
    res.status(200).send({
      message: "Till number added to all doctors successfully",
      success: true,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error updating doctors",
      success: false,
    })
  }
});


// module.exports = router;
export default router;
