import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import app from "../app.js";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    app.on("error", () => {
      console.log("Express Error:", error);
    });

    console.log(`\n MOngoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
    // console.log("ConnectionInstance :", connectionInstance.connection);
    
  } catch (error) {
    console.log("Database connectivity error:", error);
    process.exit(1);
  }
};

export default connectDB;
