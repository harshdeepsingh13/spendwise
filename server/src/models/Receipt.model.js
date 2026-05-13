import mongoose from "mongoose";

const receiptSchema = new mongoose.Schema(
  {
    name: { type: String },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    expense: { type: mongoose.Schema.Types.ObjectId, ref: "Expense" },
    cloudinaryPublicId: String,
    cloudinaryUrl: String,
    cloudinaryResourceType: { type: String, default: "image" },
    fileType: { type: String, enum: ["image", "pdf"], default: "image" },
    ocrStatus: { type: String, enum: ["pending", "processing", "done", "failed"], default: "pending" },
    ocrExtractedAmount: mongoose.Decimal128,
    ocrRawText: String,
    tags: [{ type: String, trim: true }],
    submitted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Receipt = mongoose.model("Receipt", receiptSchema);

