const roomSchema = new mongoose.Schema({
  roomID: String,
  hostSocketId: String,
  createdAt: { type: Date, default: Date.now },
  users: [userSchema],
});

const Room = mongoose.model("Room", roomSchema);
