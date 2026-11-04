import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
export const ROLES = ['donor', 'requester', 'hospital', 'admin'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, minlength: [2, 'Name is too short'], maxlength: 80 },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: { type: String, required: [true, 'Password is required'], minlength: [6, 'Password must be at least 6 characters'], select: false },
    phone: { type: String, required: [true, 'Phone is required'], match: [/^[0-9+\-\s]{10,15}$/, 'Enter a valid phone number (10-15 digits)'] },
    role: { type: String, enum: ROLES, default: 'requester' },
    bloodGroup: {
      type: String,
      enum: { values: BLOOD_GROUPS, message: 'Invalid blood group' },
      required: [function () { return this.role === 'donor'; }, 'Blood group is required for donors'],
    },
    city: { type: String, required: [true, 'City is required'], trim: true },
    area: { type: String, trim: true, default: '' },
    hospitalName: { type: String, trim: true },
    coordinates: { lat: Number, lng: Number },
    available: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    lastDonationDate: Date,
  },
  { timestamps: true }
);

// Indexes used by donor search and admin filters
userSchema.index({ role: 1, bloodGroup: 1, city: 1, available: 1 });
userSchema.index({ role: 1, createdAt: -1 });

// Hash the password before saving (only when it changed)
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('User', userSchema);
