import mongoose from 'mongoose';
import { BLOOD_GROUPS } from './User.js';

const responseSchema = new mongoose.Schema(
  {
    donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    response: { type: String, enum: ['accepted', 'declined'], required: true },
    respondedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const bloodRequestSchema = new mongoose.Schema(
  {
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    patientName: { type: String, required: [true, 'Patient name is required'], trim: true, maxlength: 80 },
    bloodGroup: { type: String, required: [true, 'Blood group is required'], enum: { values: BLOOD_GROUPS, message: 'Invalid blood group' } },
    units: { type: Number, required: true, min: [1, 'At least 1 unit'], max: [10, 'Maximum 10 units'], default: 1 },
    hospitalName: { type: String, required: [true, 'Hospital name is required'], trim: true },
    city: { type: String, required: [true, 'City is required'], trim: true },
    area: { type: String, trim: true, default: '' },
    coordinates: { lat: Number, lng: Number },
    contactNumber: { type: String, required: [true, 'Contact number is required'], match: [/^[0-9+\-\s]{10,15}$/, 'Enter a valid contact number'] },
    requiredDate: { type: Date, required: [true, 'Required date is needed'] },
    urgency: { type: String, enum: ['normal', 'emergency', 'critical'], default: 'normal' },
    notes: { type: String, trim: true, maxlength: 500, default: '' },
    status: { type: String, enum: ['pending', 'accepted', 'completed', 'cancelled'], default: 'pending' },
    matchedDonors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    responses: [responseSchema],
    acceptedDonor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    acceptedAt: Date,
    completedAt: Date,
    firstResponseMinutes: { type: Number, default: null }, // minutes from creation to first donor response
  },
  { timestamps: true }
);

bloodRequestSchema.index({ status: 1, createdAt: -1 });
bloodRequestSchema.index({ bloodGroup: 1, city: 1 });
bloodRequestSchema.index({ requester: 1, createdAt: -1 });
bloodRequestSchema.index({ matchedDonors: 1, createdAt: -1 });
bloodRequestSchema.index({ urgency: 1 });

export default mongoose.model('BloodRequest', bloodRequestSchema);
