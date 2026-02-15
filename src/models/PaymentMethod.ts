import mongoose, { Schema, Model } from "mongoose";

export interface IPaymentMethod {
  _id: mongoose.Types.ObjectId;
  name: string;
  order?: number;
  createdAt?: Date;
}

const PaymentMethodSchema = new Schema<IPaymentMethod>(
  {
    name: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

PaymentMethodSchema.index({ order: 1, name: 1 });

export const PaymentMethod: Model<IPaymentMethod> =
  mongoose.models.PaymentMethod ??
  mongoose.model<IPaymentMethod>("PaymentMethod", PaymentMethodSchema);
