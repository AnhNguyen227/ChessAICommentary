import mongoose, { Document, Schema } from "mongoose";

export interface Elo {
  blitz?: number;
  rapid?: number;
}


export interface IUser extends Document {
  googleId: string;
  displayName: string;
  email: string;
  avatar: string;
  chessComUsername?: string;
  chessComElo?: Elo;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    googleId: { type: String, required: true, unique: true },
    displayName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    avatar: { type: String },
    chessComUsername: { type: String },
    chessComElo: {
      blitz: { type: Number },
      rapid: { type: Number },
    },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", UserSchema);