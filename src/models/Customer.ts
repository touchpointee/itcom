import mongoose, { Schema, Model } from "mongoose";

export interface ICustomer {
  _id: mongoose.Types.ObjectId;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  createdAt?: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    address: { type: String, trim: true },
  },
  { timestamps: true }
);

export const Customer: Model<ICustomer> =
  mongoose.models.Customer ?? mongoose.model<ICustomer>("Customer", CustomerSchema);
