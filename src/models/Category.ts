import mongoose, { Schema, Model } from "mongoose";

export interface ICategory {
  _id: mongoose.Types.ObjectId;
  name: string;
  createdAt?: Date;
}

const CategorySchema = new Schema<ICategory>(
  { name: { type: String, required: true, trim: true } },
  { timestamps: true }
);

export const Category: Model<ICategory> =
  mongoose.models.Category ?? mongoose.model<ICategory>("Category", CategorySchema);
