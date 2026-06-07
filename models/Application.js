const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  applicationId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  passportNo: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    required: true,
    default: 'Under Process',
    enum: ['Under Process', 'Sent to Embassy', 'Ready for Collection', 'Approved']
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Application', ApplicationSchema);