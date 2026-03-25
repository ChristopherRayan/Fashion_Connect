import mongoose, { Schema } from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoosePaginate from 'mongoose-paginate-v2';
const userSchema = new Schema({
 name: { type: String, required: true, trim: true },
 email: { type: String, required: true, unique: true, lowercase: true, trim: true },
 password: { type: String, required: [true, 'Password is required'] },
 phone: { type: String },
 role: {
     type: String,
     enum: ['CLIENT', 'DESIGNER', 'ADMIN', 'TAILOR'],
     default: 'CLIENT',
     required: true
 },
 status: {
     type: String,
     enum: ['ACTIVE', 'PENDING_VERIFICATION', 'SUSPENDED', 'DEACTIVATED'],
     default: 'ACTIVE'
 },
 verified: { type: Boolean, default: false },

 // Email verification fields (for new users only)
 emailVerified: { type: Boolean }, // No default - undefined for legacy users, false for new users
 emailVerifiedAt: { type: Date },

 lastLogin: { type: Date },
 address: {
     street: String,
     city: String,
     country: String,
     zipCode: String
 },
 refreshToken: { type: String },
 
 // Designer specific fields
 businessName: { type: String },
 bio: { type: String },
 specialty: { type: String },
 experience: { type: Number, default: 0 }, // Years of experience
 location: { type: String },
 businessWebsite: { type: String }, // Portfolio/website URL
 profileImage: { type: String },
 portfolioImages: [{ type: String }],
 customOrdersAvailable: { type: Boolean },
 turnaroundTime: { type: String },
 
 // Tailor specific fields
 specialties: [{ type: String }], // Array of specialties for tailors

 // Designer verification documents
 documents: {
   nationalId: { type: String },
   businessRegistration: { type: String },
   taxCertificate: { type: String },
   portfolio: { type: String }
 },
 rejectionReason: { type: String },
 
 // Admin specific fields
 permissions: [{ type: String }],

 // Tailor specific fields
 designerId: { 
   type: Schema.Types.ObjectId, 
   ref: 'User',
   required: function() {
     return this.role === 'TAILOR';
   }
 },

 // Online status tracking
 isOnline: { type: Boolean, default: false },
 lastSeen: { type: Date, default: Date.now }
}, { timestamps: true });

// Add pagination plugin
userSchema.plugin(mongoosePaginate);

userSchema.pre("save", async function (next) {
 if (!this.isModified("password")) return next();
 this.password = await bcrypt.hash(this.password, 10);
 next();
});
userSchema.methods.isPasswordCorrect = async function(password) {
 return await bcrypt.compare(password, this.password);
};
userSchema.methods.generateAccessToken = function() {
 return jwt.sign(
     { _id: this._id, email: this.email, name: this.name, role: this.role },
     process.env.ACCESS_TOKEN_SECRET,
     { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
 );
};
userSchema.methods.generateRefreshToken = function() {
 return jwt.sign(
     { _id: this._id },
     process.env.REFRESH_TOKEN_SECRET,
     { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
 );
};
export const User = mongoose.model('User', userSchema);
