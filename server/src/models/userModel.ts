import { Schema, model, Document, Types } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser {
  email: string;
  name: string;
  password?: string;
  googleId?: string;
  photoURL?: string;  
  phoneNumber?: string;
  authProvider: "email" | "google";
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationTokenExpires?: Date;
}

export interface IUserDocument extends IUser, Document {
  _id: Types.ObjectId;
}

const userSchema = new Schema<IUserDocument>(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    name: { type: String, required: true },
    password: { type: String, select: false },
    googleId: { type: String, unique: true, sparse: true },
    photoURL: { type: String },
    phoneNumber: { type: String },
    authProvider: { type: String, required: true, enum: ["email", "google"] },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false },
    emailVerificationTokenExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const UserModel = model<IUserDocument>("User", userSchema);
export default UserModel;

