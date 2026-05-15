import mongoose from "mongoose";
// Make sure this exists in users.js
import bcrypt from 'bcryptjs';
// const userSchema = new mongoose.Schema({
//     name: { type: String, required: true },
//     email: { type: String, required: true, unique: true },
//     password: { type: String, default: null }, // Initially null since they haven't set one
//     isVerified: { type: Boolean, default: false },
//     otp: { type: String },
//     otpExpires: { type: Date }
// });

// module.exports = mongoose.model('User', userSchema);

 const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      default: null, // null until user sets it via OTP flow
    },
    role: {
      type: String,
      enum: ['admin', 'user'],
      default: 'user',
    },
    avatar: {
      type: String,
      default: '', // optional profile picture URL
    },
    bio: {
      type: String,
      default: '',
    },
    lastLogin: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Hash password before saving
// userSchema.pre('save', async function (next) {
//   if (!this.isModified('password') || !this.password) return next();
//   this.password = await bcrypt.hash(this.password, 8);
//   next();
// });
// ✅ Correct — async pre-save hooks don't use next()
userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  this.password = await bcrypt.hash(this.password, 8);
});

// Compare password helper
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Never return password in JSON responses
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};
export default mongoose.model('User', userSchema);