const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["Admin", "Logistics Manager", "Operations User"],
      default: "Operations User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
