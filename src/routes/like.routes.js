import { Router } from "express";
import {
  getLikedVideos,
  toggleCommentLike,
  toggleVideoLike,
  toggleTweetLike,
  getVideoLikes,
  getCommentLikes,
  getTweetLikes,
} from "../controllers/like.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/toggle/v/:videoId").post(toggleVideoLike).get(getVideoLikes);
router
  .route("/toggle/c/:commentId")
  .post(toggleCommentLike)
  .get(getCommentLikes);
router.route("/toggle/t/:tweetId").post(toggleTweetLike).get(getTweetLikes);
router.route("/videos").get(getLikedVideos);

export default router;

//   app.use("/api/v1/likes", likeRouter);
