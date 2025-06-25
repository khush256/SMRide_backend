require("dotenv").config();
const express = require("express");
const router = express.Router();
const User = require("../models/user");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const twilio = require("twilio")(accountSid, authToken);

//Generate and send OTP

router.post("/send-otp", async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: "Phone number is required" });
    }

    // Generate OTP
    let digits = "0123456789";
    otp = "";
    for (let i = 0; i < 5; i++) {
      otp += digits[Math.floor(Math.random() * 10)];
    }

    // Set OTP expiry (5 minutes)
    const otpExpires = new Date();
    otpExpires.setMinutes(otpExpires.getMinutes() + 5);

    //Find user or create new one if doesn't exits
    let user = await User.findOneAndUpdate(
      { phone },
      { otp, otpExpires },
      { new: true, upsert: true }
    );

    //Send OTP (using Twilio)
    // await twilio.messages.create({
    //     body: `${otp} is your OTP for User ID ${phone}. Please enter the OTP to proceed and do not share it with anyone `,
    //     from: process.env.TWILIO_PHONE_NUMBER,
    //     to: `+91${phone}`,
    // })

    res.status(200).json({
      message: "OTP sent successfully",
      phone: user.phone,
      otp: otp,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//Verify OTP and login
router.post("/verify-otp", async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ error: "Phone and OTP are required" });
    }

    //Find user
    const user = await User.findOne({ phone });
    console.log(user);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if OTP matches and isn't expired
    if (user.otp !== otp || new Date() > user.otpExpires) {
      return res.status(401).json({ error: "Invalid or expired OTP" });
    }

    // Clear OTP after successful verification
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    // Check if profile is complete
    const isProfileComplete = user.isProfileComplete;

    // Generate token
    const token = user.token || generateNewToken();
    user.token = token;
    await user.save();

    console.log(user);

    res.status(200).json({
      message: "Login successful",
      token,
      isProfileComplete,
      user: {
        phone: user.phone,
        ...(isProfileComplete && {
          name: user.name,
          branch: user.branch,
          year: user.year,
          vehicleNo: user.vehicleNo,
        }),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to generate tokens
function generateNewToken() {
  return require("crypto").randomBytes(32).toString("hex");
}

//Complete profile
router.post("/complete-profile", async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: "Request body is missing" });
    }
    const { token, name, branch, year, vehicleNo } = req.body;

    if (!token || !name || !branch || !year) {
      return res.status(400).json({ error: "All fields are required" });
    }
    // Find user by phone
    const user = await User.findOneAndUpdate(
      { token },
      { name, branch, year, vehicleNo, isProfileComplete: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // isProfileComplete will be automatically set to true by the pre-save hook

    res.status(200).json({
      message: "Profile completed successfully",
      token: token,
      user: {
        name: user.name,
        branch: user.branch,
        year: user.year,
        phone: user.phone,
        vehicleNo: user.vehicleNo,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/profile-status/:token", async (req, res) => {
  try {
    const user = await User.findOne({ token: req.params.token });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      isProfileComplete: user.isProfileComplete,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//Get user info
router.get("/info/:userid", async (req, res) => {
  try {
    const user = await User.findOne({ token: req.params.userid });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      name: user.name,
      branch: user.branch,
      year: user.year,
      phone: user.phone,
      vehicleNo: user.vehicleNo,
      acceptedRides: user.acceptedRides,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// This route is used to update the user's accepted rides
router.patch("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { driverName, driverPhone, location, time, rate } = req.body;

    // Create the offer object
    const offer = {
      driverName,
      driverPhone,
      location,
      time,
      rate,
    };

    // Update the user's acceptedRides array
    const user = await User.findOneAndUpdate(
      { token: userId },
      { $push: { acceptedRides: offer } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      message: "Offer submitted successfully",
      user: {
        token: user.token,
        name: user.name,
        acceptedRides: user.acceptedRides,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all accepted rides for a user by token
router.get("/accepted-rides/:token", async (req, res) => {
  try {
    const { token } = req.params;

    // Find the user by token and only return the acceptedRides field
    const user = await User.findOne({ token }, "acceptedRides");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      message: "Accepted rides fetched successfully",
      acceptedRides: user.acceptedRides,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user by token
router.get("/:token", async (req, res) => {
  try {
    const user = await User.findOne({ token: req.params.token });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      token: user.token,
      name: user.name,
      branch: user.branch,
      year: user.year,
      phone: user.phone,
      vehicleNo: user.vehicleNo,
      acceptedRides: user.acceptedRides,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update vehicleNo of user if not added
router.patch("/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { vehicleNo } = req.body; // Get vehicleNo from request body

    const updatedUser = await User.findOneAndUpdate(
      { token: token },
      { vehicleNo: vehicleNo },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit an offer for a request
router.put("/:requestID", async (req, res) => {
  try {
    const { driverName, driverPhone, location, time, rate } = req.body;
    // Check if request exists
    const user = await User.findOneAndUpdate(
      { token: req.params.userId },
      {
        $push: {
          acceptedRides: { driverName, driverPhone, location, time, rate },
        },
      },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      message: "Offer submitted successfully",
      requestID: request.requestID,
      offer,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
