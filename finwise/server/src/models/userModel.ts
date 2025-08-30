import { Schema, model, Document } from "mongoose";

export interface IUser extends Document {
  googleId: string;
  email: string;
  name: string;
  photoURL?: string;
}

const userSchema = new Schema<IUser>(
  {
    googleId: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    photoURL: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const UserModel = model<IUser>("User", userSchema);

export default UserModel;
