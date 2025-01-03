import { Router } from "express";
import {
  userAvatarUpdate,
  userCoverImageUpdate,
  changeCurrentPassword,
  getUserChannelProfile,
  getCurrentUser,
  getWatchHistory,
  loginUser,
  logOutUser,
  refreshAccessToken,
  registerUser,
  updateAccountDetails,
  SearchUser,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const userRouter = Router();

userRouter.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);
userRouter.route("/login").post(loginUser);

// Secured Routes
userRouter.route("/logout").post(verifyJWT, logOutUser);
userRouter.route("/refresh_token").post(refreshAccessToken);
userRouter.route("/password-change").post(verifyJWT, changeCurrentPassword);
userRouter.route("/current-user").get(verifyJWT, getCurrentUser);
userRouter.route("/update-account").patch(verifyJWT, updateAccountDetails);
userRouter
  .route("/avatar")
  .patch(verifyJWT, upload.single("avatar"), userAvatarUpdate);
userRouter
  .route("/cover-image")
  .patch(verifyJWT, upload.single("coverImage"), userCoverImageUpdate);
userRouter.route("/c/:username").get(verifyJWT, getUserChannelProfile);
userRouter.route("/history").get(verifyJWT, getWatchHistory);
userRouter.route("/:username").get( SearchUser);

export default userRouter;
