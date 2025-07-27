const userSchema = new mongoose.Schema({
  socketId: String,
  uid: String,
  displayName: String,
  joinedAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);
