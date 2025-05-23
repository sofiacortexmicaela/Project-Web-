// src/models/OrderCounter.js
import mongoose from 'mongoose';

const orderCounterSchema = new mongoose.Schema({
  count: { type: Number, default: 0 }
});

export default mongoose.model('OrderCounter', orderCounterSchema);
