import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { User } from '../../models/user.model.js';
import fs from 'fs';
import path from 'path';

// Update user profile
export const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const updateData = req.body;

  // Remove sensitive fields that shouldn't be updated via this endpoint
  delete updateData.password;
  delete updateData.email;
  delete updateData.role;
  delete updateData.permissions;
  delete updateData.refreshToken;

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select('-password -refreshToken');

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    console.log(`✏️ User profile updated: ${user.name} (${user.email})`);

    return res.status(200).json(
      new ApiResponse(200, user, "Profile updated successfully")
    );
  } catch (error) {
    console.error('Error updating profile:', error);
    throw new ApiError(500, error.message || "Failed to update profile");
  }
});

// Upload profile picture
export const uploadProfilePicture = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  if (!req.file) {
    throw new ApiError(400, 'No profile image file provided');
  }

  try {
    const profileImageUrl = `/uploads/profiles/${req.file.filename}`;

    // Update user with new profile image
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        profileImage: profileImageUrl,
        updatedAt: new Date()
      },
      { new: true }
    ).select('-password -refreshToken');

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    console.log(`📸 Profile picture updated for user: ${user.name}`);

    return res.status(200).json(
      new ApiResponse(200, { profileImage: profileImageUrl }, "Profile picture uploaded successfully")
    );
  } catch (error) {
    // Clean up uploaded file if database update fails
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }
    
    console.error('Error uploading profile picture:', error);
    throw new ApiError(500, error.message || "Failed to upload profile picture");
  }
});

// Upload business logo (for designers)
export const uploadBusinessLogo = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const user = req.user;

  if (user.role !== 'DESIGNER') {
    throw new ApiError(403, "Only designers can upload business logos");
  }

  if (!req.file) {
    throw new ApiError(400, 'No business logo file provided');
  }

  try {
    const businessLogoUrl = `/uploads/profiles/${req.file.filename}`;

    // Update user with new business logo
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        businessLogo: businessLogoUrl,
        updatedAt: new Date()
      },
      { new: true }
    ).select('-password -refreshToken');

    if (!updatedUser) {
      throw new ApiError(404, "User not found");
    }

    console.log(`🏢 Business logo updated for designer: ${updatedUser.name}`);

    return res.status(200).json(
      new ApiResponse(200, { businessLogo: businessLogoUrl }, "Business logo uploaded successfully")
    );
  } catch (error) {
    // Clean up uploaded file if database update fails
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }
    
    console.error('Error uploading business logo:', error);
    throw new ApiError(500, error.message || "Failed to upload business logo");
  }
});

// Delete profile picture
export const deleteProfilePicture = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  try {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Delete the old profile image file if it exists
    if (user.profileImage) {
      const imagePath = path.join(process.cwd(), 'uploads', 'profiles', path.basename(user.profileImage));
      fs.unlink(imagePath, (err) => {
        if (err) console.error('Error deleting old profile image:', err);
      });
    }

    // Remove profile image from user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        $unset: { profileImage: 1 },
        updatedAt: new Date()
      },
      { new: true }
    ).select('-password -refreshToken');

    console.log(`🗑️ Profile picture deleted for user: ${updatedUser.name}`);

    return res.status(200).json(
      new ApiResponse(200, null, "Profile picture deleted successfully")
    );
  } catch (error) {
    console.error('Error deleting profile picture:', error);
    throw new ApiError(500, error.message || "Failed to delete profile picture");
  }
});

// Upload designer verification documents
export const uploadDesignerDocuments = asyncHandler(async (req, res) => {
  console.log('📄 Document upload request received');
  console.log('👤 User ID:', req.user._id);
  console.log('📁 Files received:', req.files ? Object.keys(req.files) : 'None');
  console.log('📊 File details:', req.files);

  const userId = req.user._id;

  if (!req.files || Object.keys(req.files).length === 0) {
    console.log('❌ No documents provided in request');
    throw new ApiError(400, 'No documents provided');
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (user.role !== 'DESIGNER') {
      throw new ApiError(403, "Only designers can upload verification documents");
    }

    // Process uploaded documents
    const documents = {};
    const allowedDocuments = ['nationalId', 'businessRegistration', 'taxCertificate', 'portfolio'];

    for (const docType of allowedDocuments) {
      if (req.files[docType] && req.files[docType][0]) {
        const file = req.files[docType][0];
        documents[docType] = `/uploads/profiles/${file.filename}`;
      }
    }

    // Update user with document URLs
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        documents: { ...user.documents, ...documents },
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).select('-password -refreshToken');

    console.log(`📄 Documents uploaded for designer: ${updatedUser.name}`);

    return res.status(200).json(
      new ApiResponse(200, {
        documents: updatedUser.documents,
        uploadedCount: Object.keys(documents).length
      }, "Documents uploaded successfully")
    );
  } catch (error) {
    console.error('Error uploading documents:', error);
    throw new ApiError(500, error.message || "Failed to upload documents");
  }
});

// Upload profile image (new method for profile management)
export const uploadProfileImage = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  if (!req.file) {
    throw new ApiError(400, 'No profile image file provided');
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Delete old profile image if it exists
    if (user.profileImage) {
      const oldImagePath = path.join(process.cwd(), 'uploads', 'profiles', path.basename(user.profileImage));
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    // Update user with new profile image
    const profileImageUrl = `/uploads/profiles/${req.file.filename}`;
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        profileImage: profileImageUrl,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).select('-password -refreshToken');

    console.log(`📸 Profile image updated for user: ${updatedUser.name}`);

    return res.status(200).json(
      new ApiResponse(200, {
        profileImage: profileImageUrl
      }, "Profile image updated successfully")
    );
  } catch (error) {
    console.error('Error uploading profile image:', error);
    throw new ApiError(500, error.message || "Failed to upload profile image");
  }
});

// Upload portfolio images (new method for designers)
export const uploadPortfolioImages = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  if (!req.files || req.files.length === 0) {
    throw new ApiError(400, 'No portfolio images provided');
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (user.role !== 'DESIGNER') {
      throw new ApiError(403, "Only designers can upload portfolio images");
    }

    // Process uploaded files
    const portfolioImageUrls = req.files.map(file => `/uploads/profiles/${file.filename}`);

    // Add new images to existing portfolio
    const existingPortfolioImages = user.portfolioImages || [];
    const updatedPortfolioImages = [...existingPortfolioImages, ...portfolioImageUrls];

    // Update user with new portfolio images
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        portfolioImages: updatedPortfolioImages,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).select('-password -refreshToken');

    console.log(`🖼️ Portfolio images uploaded for designer: ${updatedUser.name} (${req.files.length} images)`);

    return res.status(200).json(
      new ApiResponse(200, {
        portfolioImages: portfolioImageUrls,
        totalPortfolioImages: updatedPortfolioImages.length
      }, "Portfolio images uploaded successfully")
    );
  } catch (error) {
    console.error('Error uploading portfolio images:', error);
    throw new ApiError(500, error.message || "Failed to upload portfolio images");
  }
});
