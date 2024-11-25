const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema({
  number: {
    type: String,
    required: true
  },
  class: {
    type: String,
    enum: ['economy', 'business', 'first'],
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  }
});

const trainSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  from: {
    type: String,
    required: true
  },
  to: {
    type: String,
    required: true
  },
  departureTime: {
    type: Date,
    required: true
  },
  arrivalTime: {
    type: Date,
    required: true
  },
  basePrice: {
    type: Number,
    required: true
  },
  seats: [seatSchema],
  status: {
    type: String,
    enum: ['scheduled', 'cancelled', 'completed'],
    default: 'scheduled'
  }
}, {
  timestamps: true
});

const Train = mongoose.model('Train', trainSchema);
module.exports = Train;
