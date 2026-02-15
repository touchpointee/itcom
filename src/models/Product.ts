import mongoose, { Schema, Model } from "mongoose";

export interface IProduct {
  _id: mongoose.Types.ObjectId;
  name: string;
  category: mongoose.Types.ObjectId;
  distributor: mongoose.Types.ObjectId;
  purchasePrice: number;
  sellingPrice: number;
  stock: number;
  imei?: string;
  createdAt?: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    distributor: { type: Schema.Types.ObjectId, ref: "Distributor", required: true },
    purchasePrice: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    imei: { type: String, trim: true },
  },
  { timestamps: true }
);

export const Product: Model<IProduct> =
  mongoose.models.Product ?? mongoose.model<IProduct>("Product", ProductSchema);
