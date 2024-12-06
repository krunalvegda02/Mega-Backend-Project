import dotenv from "dotenv";
import connectDB from "./db/index.js";
import app from "./app.js";

dotenv.config({
  path: "./env",
});

const port = process.env.PORT || 8000;

connectDB()
  .then(() => {
    app.listen(port),
      () => {
        console.log(`Server is running on port ${port}`);
      };
  })
  .catch((err) => {
    console.log("MONGODB connnection failed: ", err);
  });

/*
const app = express();

(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    app.on("error", () => {
      console.log("Express Error:", error);
    });

    app.listen(process.env.PORT, () => {
      console.log(`App is listening on post ${process.env.PORT}`);
    });
  } catch (error) {
    console.log("Database connectivity errro:", error);
  }
})();
*/
