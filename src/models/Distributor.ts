import mongoose, { Schema, Model } from "mongoose";

export interface IDistributor {
  _id: mongoose.Types.ObjectId;
  name: string;
  phone: string;
  address: string;
  vatNumber?: string;
  createdAt?: Date;
}

const DistributorSchema = new Schema<IDistributor>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    vatNumber: { type: String, trim: true },
  },
  { timestamps: true }
);

export const Distributor: Model<IDistributor> =
  mongoose.models.Distributor ?? mongoose.model<IDistributor>("Distributor", DistributorSchema);
