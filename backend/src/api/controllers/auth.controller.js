import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { User } from '../../models/user.model.js';
import { EmailVerification } from '../../models/emailVerification.model.js';
import jwt from 'jsonwebtoken';
import emailService from '../../services/emailService.js';
const generateAccessAndRefreshTokens = async (userId) => {
 try {
     const user = await User.findById(userId);
     const accessToken = user.generateAccessToken();
     const refreshToken = user.generateRefreshToken();
     user.refreshToken = refreshToken;
     await user.save({ validateBeforeSave: false });
     return { accessToken, refreshToken };
 } catch (error) {
     throw new ApiError(500, "Something went wrong while generating tokens");
 }
};
const registerUser = asyncHandler(async (req, res) => {
 const {
     name,
     email,
     password,
     role,
     verificationToken,
     // Designer-specific fields
     phone,
     location,
     businessName,
     fashionCategory,
     experience,
     portfolio
 } = req.body;

 if ([name, email, password, role].some((field) => !field || field.trim() === "")) {
     throw new ApiError(400, "All fields are required");
 }

 // Check if email verification token is provided and valid
 if (!verificationToken) {
     throw new ApiError(400, "Email verification is required. Please verify your email first.");
 }

 // Verify the email verification token
 const emailVerification = await EmailVerification.findOne({
     email: email,
     token: verificationToken,
     verified: true, // Must be verified
     expiresAt: { $gt: new Date() }
 });

 if (!emailVerification) {
     throw new ApiError(400, "Invalid or expired email verification token. Please verify your email first.");
 }

 // Check if user already exists
 const existedUser = await User.findOne({ email });
 if (existedUser) {
     throw new ApiError(409, "User with this email already exists");
 }

 // Prepare user data
 const userData = {
     name,
     email,
     password,
     role,
     emailVerified: true, // Set to true since they completed email verification
     emailVerifiedAt: new Date(),
     status: role === 'DESIGNER' ? 'PENDING_VERIFICATION' : 'ACTIVE'
 };

 // Add designer-specific fields if role is DESIGNER
 if (role === 'DESIGNER') {
     if (phone) userData.phone = phone;
     if (location) userData.location = location;
     if (businessName) userData.businessName = businessName;
     if (fashionCategory) userData.specialty = fashionCategory; // Map fashionCategory to specialty
     if (experience) userData.experience = experience; // Store experience in dedicated field
     if (portfolio) userData.businessWebsite = portfolio; // Store portfolio URL in businessWebsite field
 } else if (role === 'CLIENT') {
     // Add client-specific fields if provided
     if (phone) userData.phone = phone;
 }

 // Create the user with all relevant data
 const user = await User.create(userData);

 const createdUser = await User.findById(user._id).select("-password -refreshToken");
 if (!createdUser) {
     throw new ApiError(500, "Something went wrong while registering the user");
 }

 // Delete the email verification record since it's been used
 await EmailVerification.deleteOne({ _id: emailVerification._id });

 // Send welcome email (non-blocking)
 try {
     await emailService.sendWelcomeEmail(createdUser);
     console.log(`Welcome email sent to ${createdUser.email}`);
 } catch (emailError) {
     console.error('Failed to send welcome email:', emailError);
     // Don't fail registration if email fails
 }

 // If designer registration, notify admins
 if (createdUser.role === 'DESIGNER') {
     try {
         // TODO: Implement admin notification system
         console.log(`🔔 Admin notification: New designer ${createdUser.name} registered and needs verification`);
     } catch (notificationError) {
         console.error('Failed to send admin notification:', notificationError);
         // Don't fail registration if notification fails
     }
 }

 // Generate tokens for automatic login after registration
 const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(createdUser._id);

 const options = {
     httpOnly: true,
     secure: process.env.NODE_ENV === 'production'
 };

 return res
     .status(201)
     .cookie("accessToken", accessToken, options)
     .cookie("refreshToken", refreshToken, options)
     .json(new ApiResponse(201, {
         user: createdUser,
         accessToken,
         refreshToken
     }, "User registered and logged in successfully"));
});
const loginUser = asyncHandler(async (req, res) => {
 const { email, password } = req.body;
 if (!email || !password) {
     throw new ApiError(400, "Email and password are required");
 }
 const user = await User.findOne({ email });
 if (!user) {
     throw new ApiError(404, "User does not exist");
 }
 const isPasswordValid = await user.isPasswordCorrect(password);
 if (!isPasswordValid) {
     throw new ApiError(401, "Invalid user credentials");
 }

 // Check if email is verified (only for users who registered after email verification was implemented)
 // Legacy users (existing users) are automatically considered verified
 if (user.emailVerified === false) {
     throw new ApiError(403, "Please verify your email address before logging in. Check your inbox for the verification email.");
 }

 // Check if designer is verified before allowing login
 if (user.role === 'DESIGNER' && user.status === 'PENDING_VERIFICATION') {
     throw new ApiError(403, "Your account is pending verification. Please wait for admin approval before logging in.");
 }

 // Check if user is suspended
 if (user.status === 'SUSPENDED') {
     throw new ApiError(403, "Your account has been suspended. Please contact support for assistance.");
 }
 const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
 const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
 const options = {
     httpOnly: true,
     secure: process.env.NODE_ENV === 'production'
 };
 return res
     .status(200)
     .cookie("accessToken", accessToken, options)
     .cookie("refreshToken", refreshToken, options)
     .json(new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "User logged in successfully"));
});
const logoutUser = asyncHandler(async (req, res) => {
 await User.findByIdAndUpdate(
     req.user._id,
     { $set: { refreshToken: undefined } },
     { new: true }
 );
 const options = {
     httpOnly: true,
     secure: process.env.NODE_ENV === 'production'
 };
 return res
     .status(200)
     .clearCookie("accessToken", options)
     .clearCookie("refreshToken", options)
     .json(new ApiResponse(200, {}, "User logged out successfully"));
});
const getCurrentUser = asyncHandler(async (req, res) => {
 return res.status(200).json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

// Request email verification
const requestEmailVerification = asyncHandler(async (req, res) => {
  const { email, role } = req.body;

  if (!email || !email.trim()) {
    throw new ApiError(400, "Email is required");
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ApiError(400, "Please provide a valid email address");
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, "User with this email already exists");
  }

  // Delete any existing verification records for this email
  await EmailVerification.deleteMany({ email });

  // Generate verification token
  const verificationToken = jwt.sign(
    { email, purpose: 'email_verification' },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: '1h' }
  );

  // Create verification record
  const emailVerification = await EmailVerification.create({
    email,
    token: verificationToken,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
  });

  // Send verification email
  try {
    await emailService.sendVerificationEmail(email, verificationToken, role);
  } catch (error) {
    // Delete the verification record if email sending fails
    await EmailVerification.deleteOne({ _id: emailVerification._id });
    console.error('Email sending failed:', error);
    throw new ApiError(500, "Failed to send verification email. Please try again.");
  }

  return res.status(200).json(
    new ApiResponse(200, null, "Verification email sent successfully. Please check your inbox.")
  );
});

export { registerUser, loginUser, logoutUser, getCurrentUser, requestEmailVerification };
