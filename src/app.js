import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
//middleware required for "req.body" sending json data to server
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extented: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());


//ROutes Import
import userRouter from "./routes/user.routes.js"
//Roues declaration
app.use("/api/v1/users", userRouter)


export default app;
