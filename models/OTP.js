import mongoose from 'mongoose';
import bcrypt from 'bcryptjs'; // ✅ correct spelling, no typo

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true },
  code:  { type: String, required: true },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 },
  },
  verified: { type: Boolean, default: false },
});

// ✅ async, no next()
otpSchema.pre('save', async function () {
  if (!this.isModified('code')) return;
  this.code = await bcrypt.hash(this.code, 10);
});

otpSchema.methods.verifyCode = async function (candidateCode) {
  return bcrypt.compare(candidateCode, this.code);
};

export default mongoose.model('OTP', otpSchema);