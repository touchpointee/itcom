import mongoose, { Schema, Model } from "mongoose";
import "./Customer"; // ensure Customer model is registered before Bill (for ref)

export interface IBillItem {
  product: mongoose.Types.ObjectId;
  name: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  total: number;
}

export interface IBill {
  _id: mongoose.Types.ObjectId;
  billNumber: string;
  customer?: mongoose.Types.ObjectId;
  items: IBillItem[];
  withVat: boolean;
  subtotal: number;
  wholeDiscount?: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  createdAt: Date;
}

const BillItemSchema = new Schema<IBillItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
  },
  { _id: false }
);

const BillSchema = new Schema<IBill>(
  {
    billNumber: { type: String, required: true, unique: true },
    customer: { type: Schema.Types.ObjectId, ref: "Customer" },
    items: [BillItemSchema],
    withVat: { type: Boolean, default: true },
    subtotal: { type: Number, required: true },
    wholeDiscount: { type: Number, default: 0 },
    vatRate: { type: Number, default: 5 },
    vatAmount: { type: Number, default: 0 },
    total: { type: Number, required: true },
  },
  { timestamps: true }
);

BillSchema.index({ createdAt: -1 });

export const Bill: Model<IBill> = mongoose.models.Bill ?? mongoose.model<IBill>("Bill", BillSchema);
