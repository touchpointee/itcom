import mongoose, { Schema, Model } from "mongoose";
import "./Customer";

export type ServiceStatus = "Pending" | "In Progress" | "Completed";

export interface IService {
  _id: mongoose.Types.ObjectId;
  customer?: mongoose.Types.ObjectId;
  device: string;
  issue: string;
  status: ServiceStatus;
  estimatedCost?: number;
  finalCost?: number;
  createdAt?: Date;
}

const ServiceSchema = new Schema<IService>(
  {
    customer: { type: Schema.Types.ObjectId, ref: "Customer" },
    device: { type: String, required: true, trim: true },
    issue: { type: String, required: true, trim: true },
    status: { type: String, enum: ["Pending", "In Progress", "Completed"], default: "Pending" },
    estimatedCost: { type: Number, min: 0 },
    finalCost: { type: Number, min: 0 },
  },
  { timestamps: true }
);

export const Service: Model<IService> =
  mongoose.models.Service ?? mongoose.model<IService>("Service", ServiceSchema);
