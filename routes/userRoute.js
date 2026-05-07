import express from "express";
const router = express.Router();
import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
import jwt from "jsonwebtoken";
import { Buffer } from "buffer";
import User from "../models/userModel.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import Doctor from "../models/doctorModel.js";
import Appointment from "../models/appointmentModel.js";

const scryptAsync = promisify(scrypt);
const OTP_EXPIRY_MINUTES = 10;

const hashPassword = async (password) => {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scryptAsync(password, salt, 64);
  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
};

const hashOtp = async (otp) => {
  const derivedKey = await scryptAsync(otp, process.env.JWT_SECRET, 64);
  return derivedKey.toString("hex");
};

const verifyOtp = async (otp, storedOtpHash) => {
  if (!storedOtpHash) {
    return false;
  }

  const derivedKey = await scryptAsync(otp, process.env.JWT_SECRET, 64);
  return timingSafeEqual(Buffer.from(storedOtpHash, "hex"), derivedKey);
};

const verifyPassword = async (password, storedPassword) => {
  if (!storedPassword?.startsWith("scrypt:")) {
    return false;
  }

  const [, salt, key] = storedPassword.split(":");
  const derivedKey = await scryptAsync(password, salt, 64);
  return timingSafeEqual(Buffer.from(key, "hex"), derivedKey);
};

const timeToMinutes = (time) => {
  const [hours, minutes] = String(time).split(":").map(Number);
  return hours * 60 + minutes;
};

const createOtp = () => {
  return String(Math.floor(100000 + Math.random() * 900000));
};

const sendVerificationEmail = async ({ email, name, otp }) => {
  if (!process.env.RESEND_API_KEY) {
    console.log(`Email verification OTP for ${email}: ${otp}`);
    return { delivered: false, fallback: true };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || "CareSlot <onboarding@resend.dev>",
      to: [email],
      subject: "Verify your CareSlot account",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #17212b;">
          <h2>Verify your CareSlot account</h2>
          <p>Hello ${name || "there"},</p>
          <p>Use this code to finish creating your account:</p>
          <p style="font-size: 28px; font-weight: 700; letter-spacing: 4px;">${otp}</p>
          <p>This code expires in ${OTP_EXPIRY_MINUTES} minutes.</p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.warn(`Resend email failed for ${email}: ${error}`);
    console.log(`Email verification OTP for ${email}: ${otp}`);
    return { delivered: false, fallback: true };
  }

  return { delivered: true, fallback: false };
};

/*
M-Pesa integration is paused for now. Uncomment this block when payment
collection is ready to be wired back into appointment booking.

const consumerKey = process.env.MPESA_CONSUMER_KEY;
const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
const passKey = process.env.MPESA_PASS_KEY;
const businessShortCode = 174379;

const generateAccessToken = async () => {
  try {
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString(
      "base64"
    );
    const response = await fetch(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      return data.access_token;
    } else {
      throw new Error(`M-Pesa token request failed with status ${response.status}`);
    }
  } catch (error) {
    console.error(
      "Error generating access token:",
      error.response?.data || error.message
    );
    throw error;
  }
};
router.post("/payment-request", async (req, res) => {
  try {
    const {
      phoneNumber = process.env.MPESA_TEST_PHONE_NUMBER,
      amount = 1,
      accountReference = "AppointmentPayment",
      transactionDesc = "Appointment booking payment",
    } = req.body;

    if (!phoneNumber || !amount || !process.env.MPESA_CALLBACK_URL) {
      return res.status(400).json({
        success: false,
        error: "Phone number, amount, and MPESA_CALLBACK_URL are required",
      });
    }

    const accessToken = await generateAccessToken();
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T]/g, "")
      .split(".")[0];
    const password = Buffer.from(
      `${businessShortCode}${passKey}${timestamp}`
    ).toString("base64");

    const requestData = {
      BusinessShortCode: businessShortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Number(amount),
      PartyA: phoneNumber,
      PartyB: businessShortCode,
      PhoneNumber: phoneNumber,
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      AccountReference: accountReference,
      TransactionDesc: transactionDesc,
    };

    const stkResponse = await fetch(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      }
    );

    const responseData = await stkResponse.json();

    if (stkResponse.ok) {
      res.status(200).json({ success: true, data: responseData });
    } else {
      res.status(stkResponse.status).json({ success: false, data: responseData });
    }
  } catch (error) {
    console.error("STK Push Error:", error.message);
    res.status(500).json({ success: false, error: "STK Push failed" });
  }
});
*/


router.post("/register", async (req, res) => {
  try {
    const email = req.body.email?.toLowerCase().trim();
    const userExists = await User.findOne({ email });

    if (userExists?.isVerified) {
      return res
        .status(400)
        .send({ message: "User already exists", success: false });
    }

    const password = req.body.password;
    const otp = createOtp();
    const emailOtpHash = await hashOtp(otp);
    const emailOtpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    const userData = {
      ...req.body,
      email,
      password: await hashPassword(password),
      isVerified: false,
      emailOtpHash,
      emailOtpExpiresAt,
    };

    const user = userExists
      ? await User.findByIdAndUpdate(userExists._id, userData, { new: true })
      : await new User(userData).save();

    const emailResult = await sendVerificationEmail({ email: user.email, name: user.name, otp });

    res.status(200).send({
      message: emailResult.delivered
        ? "Verification code sent to your email"
        : "Verification code created. Check the server terminal for the OTP.",
      success: true,
      data: { email: user.email, needsVerification: true },
    });
  } catch (error) {
    console.log("Registration error:", error);
    res.status(500).send({ message: "Error creating user", success: false });
  }
});

router.post("/verify-email-otp", async (req, res) => {
  try {
    const email = req.body.email?.toLowerCase().trim();
    const otp = String(req.body.otp || "").trim();

    if (!email || !otp) {
      return res.status(400).send({
        message: "Email and verification code are required",
        success: false,
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).send({ message: "User does not exist", success: false });
    }

    if (user.isVerified) {
      return res.status(200).send({ message: "Account is already verified", success: true });
    }

    if (!user.emailOtpExpiresAt || user.emailOtpExpiresAt < new Date()) {
      return res.status(400).send({ message: "Verification code has expired", success: false });
    }

    const isMatch = await verifyOtp(otp, user.emailOtpHash);
    if (!isMatch) {
      return res.status(400).send({ message: "Verification code is incorrect", success: false });
    }

    user.isVerified = true;
    user.emailOtpHash = undefined;
    user.emailOtpExpiresAt = undefined;
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.status(200).send({
      message: "Email verified successfully",
      success: true,
      data: token,
    });
  } catch (error) {
    console.log("OTP verification error:", error);
    res.status(500).send({ message: "Error verifying email", success: false });
  }
});

router.post("/resend-email-otp", async (req, res) => {
  try {
    const email = req.body.email?.toLowerCase().trim();
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).send({ message: "User does not exist", success: false });
    }

    if (user.isVerified) {
      return res.status(400).send({ message: "Account is already verified", success: false });
    }

    const otp = createOtp();
    user.emailOtpHash = await hashOtp(otp);
    user.emailOtpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    await user.save();

    const emailResult = await sendVerificationEmail({ email: user.email, name: user.name, otp });

    res.status(200).send({
      message: emailResult.delivered
        ? "Verification code resent"
        : "Verification code recreated. Check the server terminal for the OTP.",
      success: true,
    });
  } catch (error) {
    console.log("Resend OTP error:", error);
    res.status(500).send({ message: "Error resending verification code", success: false });
  }
});

router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res
        .status(404)
        .send({ message: "User does not exist", success: false });
    }
    if (!user.isActive) {
      return res.status(403).send({
        message: "This account has been deactivated. Contact support.",
        success: false,
      });
    }
    if (!user.isVerified) {
      return res.status(403).send({
        message: "Please verify your email before logging in",
        success: false,
        data: { needsVerification: true, email: user.email },
      });
    }
    const isMatch = await verifyPassword(req.body.password, user.password);
    if (!isMatch) {
      res
        .status(200)
        .send({ message: "Password is incorrect", success: false });
    } else {
      user.lastLoginAt = new Date();
      user.loginCount = (user.loginCount || 0) + 1;
      await user.save();
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });
      res
        .status(200)
        .send({ message: "Login Successful", success: true, data: token });
    }
  } catch (error) {
    console.log("Displaying login errors :", error);
    res.status(500).send({ message: "Error logging in", success: false });
  }
});

router.post("/get-user-by-id", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.body.userId }).select("-password");
    if (!user) {
      res.status(404).send({ message: "User does not exist", success: false });
    } else {
      res.status(200).send({
        success: true,
        data: user,
      });
    }
  } catch (error) {
    res
      .status(500)
      .send({ message: "User info not found", success: false, error });
  }
});

router.post("/update-user-profile", authMiddleware, async (req, res) => {
  try {
    if (req.body.password) {
      req.body.password = await hashPassword(req.body.password);
    } else {
      delete req.body.password;
    }

    const updatedUser = await User.findOneAndUpdate(
      {
        _id: req.body.userId,
      },
      req.body,
      { new: true } //Returns the updated document
    );
    res.status(200).send({
      success: true,
      message: "User profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.log("Update profile error is : ", error);
    res.status(500).send({
      message: "Error updating user profile",
      success: false,
      error,
    });
  }
});

router.post("/apply-doctor-account", authMiddleware, async (req, res) => {
  try {
    const requiredFields = [
      "firstName",
      "lastName",
      "phoneNumber",
      "address",
      "specialization",
      "experience",
      "consultationFees",
      "timings",
      "practitionerCadre",
      "regulator",
      "registrationNumber",
    ];
    const missingField = requiredFields.find((field) => !req.body[field]);
    if (missingField) {
      return res.status(400).send({
        success: false,
        message: `${missingField} is required`,
      });
    }

    const existingApplication = await Doctor.findOne({ userId: req.body.userId });
    if (existingApplication) {
      return res.status(400).send({
        success: false,
        message: "You already have a practitioner application on file",
      });
    }

    const newDoctor = new Doctor({ ...req.body, status: "pending" });
    await newDoctor.save();
    const adminUser = await User.findOne({ isAdmin: true });
    if (!adminUser) {
      return res.status(200).send({
        success: true,
        message: "Doctor account applied successfully",
      });
    }

    const unseenNotifications = adminUser.unseenNotifications;
    unseenNotifications.push({
      type: "new-doctor-request",
      message: `${newDoctor.firstName} ${newDoctor.lastName} has applied for doctor account`,
      data: {
        doctorId: newDoctor._id,
        name: newDoctor.firstName + " " + newDoctor.lastName,
      },
      onClickPath: "/admin/doctorslist",
    });
    await User.findByIdAndUpdate(adminUser._id, { unseenNotifications });
    res.status(200).send({
      success: true,
      message: "Doctor account applied successfully",
    });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .send({ message: "Error applying for doctor account", success: false });
  }
});

router.post(
  "/mark-all-notifications-as-seen",
  authMiddleware,
  async (req, res) => {
    try {
      const user = await User.findOne({ _id: req.body.userId });
      if (!user) {
        return res.status(404).send({ message: "User not found", success: false });
      }
      const unseenNotifications = user._doc.unseenNotifications;
      const seenNotifications = user._doc.seenNotifications;
      seenNotifications.push(...unseenNotifications);
      user.unseenNotifications = [];
      user.seenNotifications = seenNotifications;
      const updatedUser = await user.save();
      updatedUser.password = undefined;

      res.status(200).send({
        success: true,
        message: "All notifications marked as seen",
      });
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .send({ message: "Error clearing notifications", success: false });
    }
  }
);

router.post("/delete-all-notifications", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.body.userId });
    if (!user) {
      return res.status(404).send({ message: "User not found", success: false });
    }
    user.seenNotifications = [];
    user.unseenNotifications = [];

    const updatedUser = await user.save();
    updatedUser.password = undefined;

    res.status(200).send({
      success: true,
    });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .send({ message: "Error clearing notifications", success: false });
  }
});

router.get("/get-all-approved-doctors", async (req, res) => {
  try {
    const doctors = await Doctor.find({ status: "verified" }).sort({ createdAt: -1 });
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

router.post("/book-appointment", authMiddleware, async (req, res) => {
  try {
    req.body.status = "pending";
    const newAppointment = new Appointment(req.body);
    await newAppointment.save();
    const doctorUserId = req.body.doctorInfo?.userId;
    const patientName = req.body.userInfo?.name || "A patient";

    if (doctorUserId) {
      const user = await User.findOne({ _id: doctorUserId });
      if (user) {
        user.unseenNotifications.push({
          type: "new-appointment-request",
          message: `${patientName} has sent an appointment request`,
          onClickPath: "/doctor/appointments",
        });
        await user.save();
      }
    }
    res.status(200).send({
      message: "Appointment booked successfully",
      success: true,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error booking appointment",
      success: false,
      error,
    });
  }
});

router.post(["/check-booking-availability", "/check-booking-avilability"], authMiddleware, async (req, res) => {
  try {
    const { date, time } = req.body;
    const doctorId = req.body.doctorId;
    const requestedTime = timeToMinutes(time);
    const appointments = await Appointment.find({
      doctorId,
      date,
    });
    const hasConflict = appointments.some((appointment) => {
      return Math.abs(timeToMinutes(appointment.time) - requestedTime) <= 60;
    });
    if (hasConflict) {
      return res.status(200).send({
        message: "Appointments not available",
        success: false,
      });
    } else {
      return res.status(200).send({
        message: "Appointments available",
        success: true,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error booking appointment",
      success: false,
      error,
    });
  }
});

router.get("/get-appointments-by-user-id", authMiddleware, async (req, res) => {
  try {
    const appointments = await Appointment.find({ userId: req.body.userId });
    res.status(200).send({
      message: "Appointments fetched successfully",
      success: true,
      data: appointments,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error fetching appointments",
      success: false,
      error,
    });
  }
});

// module.exports = router;
export default router;
