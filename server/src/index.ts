import express from "express";
import http from "http";
import cors from "cors";
import session from "express-session";
import MongoStore from "connect-mongo";
import passport from "passport";
import dotenv from "dotenv";
import { connectDB } from "./config/db";
import authRoutes from "./routes/auth";
import "./config/passport";
import { initSocket } from "./socket/index";
import { Server } from "socket.io";
import gamesRouter from "./routes/games";


dotenv.config();

const app = express();
const server = http.createServer(app);

app.set("trust proxy", 1);

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
}));
app.use(express.json());
const isProd = !!process.env.SERVER_URL;
app.use(session({
  secret: process.env.SESSION_SECRET as string,
  resave: false,
  saveUninitialized: false,
  proxy: isProd,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI as string }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    httpOnly: true,
  },
}));
console.log("Session cookie mode:", isProd ? "secure/SameSite=None (prod)" : "lax (dev)");
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/auth", authRoutes);
app.use("/api/games", gamesRouter);

// Health check
app.get("/", (req, res) => {
  res.json({ status: "CAIC server running" });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { server };

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST"],
  },
});

initSocket(io);