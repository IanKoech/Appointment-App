import "dotenv/config";
import mongoose from "mongoose";
import { randomBytes, scrypt } from "crypto";
import { promisify } from "util";
import User from "../models/userModel.js";
import Doctor from "../models/doctorModel.js";
import Appointment from "../models/appointmentModel.js";

const scryptAsync = promisify(scrypt);
const DEMO_PASSWORD = "Virus@2000";

const hashPassword = async (password) => {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scryptAsync(password, salt, 64);
  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
};

const daysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

const demoUsers = [
  {
    name: "Ian Koech",
    email: "iankoech9@gmail.com",
    phoneNumber: "254700000001",
    isAdmin: true,
    lastLoginAt: daysAgo(0),
    loginCount: 9,
  },
  {
    name: "Grace Wanjiku",
    email: "grace.patient@example.com",
    phoneNumber: "254711000101",
    lastLoginAt: daysAgo(0),
    loginCount: 4,
  },
  {
    name: "Kevin Otieno",
    email: "kevin.patient@example.com",
    phoneNumber: "254711000102",
    lastLoginAt: daysAgo(1),
    loginCount: 6,
  },
  {
    name: "Asha Njeri",
    email: "asha.patient@example.com",
    phoneNumber: "254711000103",
    lastLoginAt: daysAgo(3),
    loginCount: 2,
  },
  {
    name: "David Mwangi",
    email: "david.patient@example.com",
    phoneNumber: "254711000104",
    lastLoginAt: daysAgo(8),
    loginCount: 1,
  },
  {
    name: "Dr. Amina Kareem",
    email: "amina.doctor@example.com",
    phoneNumber: "254722000201",
    isDoctor: true,
    lastLoginAt: daysAgo(0),
    loginCount: 12,
  },
  {
    name: "Brian Otieno",
    email: "brian.cardio@example.com",
    phoneNumber: "254722000202",
    isDoctor: true,
    lastLoginAt: daysAgo(2),
    loginCount: 7,
  },
  {
    name: "Leah Mwangi",
    email: "leah.derm@example.com",
    phoneNumber: "254722000203",
    isDoctor: true,
    lastLoginAt: daysAgo(4),
    loginCount: 5,
  },
  {
    name: "Paul Kimani",
    email: "paul.pending@example.com",
    phoneNumber: "254722000204",
    lastLoginAt: daysAgo(1),
    loginCount: 3,
  },
  {
    name: "Mercy Adhiambo",
    email: "mercy.nurse@example.com",
    phoneNumber: "254722000205",
    lastLoginAt: daysAgo(5),
    loginCount: 2,
  },
  {
    name: "Samuel Kibet",
    email: "samuel.expired@example.com",
    phoneNumber: "254722000206",
    lastLoginAt: null,
    loginCount: 0,
  },
];

const practitionerProfiles = [
  {
    email: "amina.doctor@example.com",
    firstName: "Amina",
    lastName: "Kareem",
    practitionerCadre: "doctor",
    regulator: "KMPDC",
    registrationNumber: "KMPDC-A-10291",
    specialization: "Family Medicine",
    experience: "8 years",
    consultationFees: 1800,
    address: "Westlands Medical Centre, Nairobi",
    timings: ["09:00", "17:00"],
    status: "verified",
    verificationNotes: "Verified manually against KMPDC register.",
  },
  {
    email: "brian.cardio@example.com",
    firstName: "Brian",
    lastName: "Otieno",
    practitionerCadre: "doctor",
    regulator: "KMPDC",
    registrationNumber: "KMPDC-C-28440",
    specialization: "Cardiology",
    experience: "12 years",
    consultationFees: 3500,
    address: "Upper Hill Clinic, Nairobi",
    timings: ["10:00", "16:00"],
    status: "verified",
    verificationNotes: "Verified manually against KMPDC register.",
  },
  {
    email: "leah.derm@example.com",
    firstName: "Leah",
    lastName: "Mwangi",
    practitionerCadre: "doctor",
    regulator: "KMPDC",
    registrationNumber: "KMPDC-D-77812",
    specialization: "Dermatology",
    experience: "6 years",
    consultationFees: 2200,
    address: "Karen Specialist Suites, Nairobi",
    timings: ["08:30", "15:30"],
    status: "verified",
    verificationNotes: "Verified manually against KMPDC register.",
  },
  {
    email: "paul.pending@example.com",
    firstName: "Paul",
    lastName: "Kimani",
    practitionerCadre: "clinical-officer",
    regulator: "COC",
    registrationNumber: "COC-P-88210",
    specialization: "Primary Care",
    experience: "5 years",
    consultationFees: 1200,
    address: "Thika Town Clinic",
    timings: ["08:00", "14:00"],
    status: "pending",
    verificationNotes: "",
  },
  {
    email: "mercy.nurse@example.com",
    firstName: "Mercy",
    lastName: "Adhiambo",
    practitionerCadre: "nurse",
    regulator: "NCK",
    registrationNumber: "NCK-M-45120",
    specialization: "Maternal Health",
    experience: "9 years",
    consultationFees: 900,
    address: "Kisumu Family Health Centre",
    timings: ["07:30", "13:30"],
    status: "rejected",
    verificationNotes: "Registration number could not be matched during manual review.",
  },
  {
    email: "samuel.expired@example.com",
    firstName: "Samuel",
    lastName: "Kibet",
    practitionerCadre: "doctor",
    regulator: "KMPDC",
    registrationNumber: "KMPDC-S-55241",
    specialization: "Orthopedics",
    experience: "10 years",
    consultationFees: 2800,
    address: "Eldoret Bone and Joint Clinic",
    timings: ["11:00", "18:00"],
    status: "expired",
    verificationNotes: "License marked expired during manual review.",
  },
];

const appointmentSeeds = [
  {
    patientEmail: "grace.patient@example.com",
    doctorEmail: "amina.doctor@example.com",
    date: "12-05-2026",
    time: "09:30",
    status: "pending",
    reason: "Recurring headaches and fatigue",
  },
  {
    patientEmail: "kevin.patient@example.com",
    doctorEmail: "brian.cardio@example.com",
    date: "13-05-2026",
    time: "11:00",
    status: "approved",
    reason: "Chest discomfort after exercise",
  },
  {
    patientEmail: "asha.patient@example.com",
    doctorEmail: "leah.derm@example.com",
    date: "14-05-2026",
    time: "10:15",
    status: "pending",
    reason: "Skin irritation follow-up",
  },
  {
    patientEmail: "david.patient@example.com",
    doctorEmail: "amina.doctor@example.com",
    date: "15-05-2026",
    time: "14:00",
    status: "cancelled",
    reason: "General consultation",
  },
];

const main = async () => {
  if (!process.env.MONGO_URL) {
    throw new Error("MONGO_URL is not set");
  }

  await mongoose.connect(process.env.MONGO_URL);
  const hashedPassword = await hashPassword(DEMO_PASSWORD);
  const userByEmail = new Map();

  for (const user of demoUsers) {
    const savedUser = await User.findOneAndUpdate(
      { email: user.email },
      {
        ...user,
        password: hashedPassword,
        isVerified: true,
        isActive: true,
        unseenNotifications: [
          {
            type: "Demo account",
            message: "This seeded account is ready for testing.",
            onClickPath: "/notifications",
          },
        ],
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    userByEmail.set(user.email, savedUser);
  }

  const doctorByEmail = new Map();
  for (const profile of practitionerProfiles) {
    const user = userByEmail.get(profile.email);
    const doctor = await Doctor.findOneAndUpdate(
      { userId: String(user._id) },
      {
        ...profile,
        userId: String(user._id),
        phoneNumber: user.phoneNumber,
        website: "",
        tillNumber: 174379,
        verifiedAt: profile.status === "verified" ? new Date() : undefined,
        verifiedBy: String(userByEmail.get("iankoech9@gmail.com")._id),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    doctorByEmail.set(profile.email, doctor);
  }

  await Appointment.deleteMany({
    "userInfo.email": { $in: appointmentSeeds.map((item) => item.patientEmail) },
  });

  for (const appointment of appointmentSeeds) {
    const patient = userByEmail.get(appointment.patientEmail);
    const doctor = doctorByEmail.get(appointment.doctorEmail);
    await Appointment.create({
      userId: String(patient._id),
      doctorId: String(doctor._id),
      doctorInfo: doctor.toObject(),
      userInfo: {
        name: patient.name,
        email: patient.email,
        phoneNumber: patient.phoneNumber,
      },
      date: appointment.date,
      time: appointment.time,
      status: appointment.status,
      reason: appointment.reason,
    });
  }

  console.log("Demo data seeded.");
  console.log(`Shared password for all demo users: ${DEMO_PASSWORD}`);
  console.log("Useful accounts:");
  console.log("- Admin: iankoech9@gmail.com");
  console.log("- Patient: grace.patient@example.com");
  console.log("- Verified doctor: amina.doctor@example.com");
  console.log("- Pending practitioner: paul.pending@example.com");

  await mongoose.disconnect();
};

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
