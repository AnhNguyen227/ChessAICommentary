import mongoose, { Document, Schema } from "mongoose";

export interface IGame extends Document {
  roomId: string;
  host: mongoose.Types.ObjectId | null;
  away: mongoose.Types.ObjectId | null;
  hostColor: "white" | "black";
  timeControl: {
    minutes: number;
    increment: number;
  };
  status: "waiting" | "active" | "completed";
  winner: "host" | "away" | "draw" | null;
  endReason:
  | "checkmate" | "forfeit" | "timeout" | "resign"
  | "draw" | "stalemate" | "insufficient_material"
  | "threefold_repetition" | "fifty_move_rule"
  | null;
  moves: string[];
  pgn: string;
  isStockfish: boolean;
  stockfishLevel: number | null;
  commentaryStyle: string | null;
  createdAt: Date;
}

const GameSchema = new Schema<IGame>(
  {
    roomId: { type: String, required: true, unique: true },
    host: { type: Schema.Types.ObjectId, ref: "User", default: null },
    away: { type: Schema.Types.ObjectId, ref: "User", default: null },
    hostColor: { type: String, enum: ["white", "black"], required: true },
    timeControl: {
      minutes: { type: Number, required: true },
      increment: { type: Number, required: true },
    },
    status: {
      type: String,
      enum: ["waiting", "active", "completed"],
      default: "waiting",
    },
    winner: {
      type: String,
      enum: ["host", "away", "draw", null],
      default: null,
    },
    endReason: {
      type: String,
      enum: [
        "checkmate", "forfeit", "timeout", "resign",
        "draw", "stalemate", "insufficient_material",
        "threefold_repetition", "fifty_move_rule",
        null
      ],
      default: null,
    },
    moves: [{ type: String }],
    pgn: { type: String, default: "" },
    isStockfish: { type: Boolean, default: false },
    stockfishLevel: { type: Number, default: null },
    commentaryStyle: { type: String, default: null },
  },
  { timestamps: true },
);

export default mongoose.model<IGame>("Game", GameSchema);