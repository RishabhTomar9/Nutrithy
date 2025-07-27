import mongoose from 'mongoose';

const SearchSchema = new mongoose.Schema({
  query: {
    type: String,
    required: true,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Search', SearchSchema);
