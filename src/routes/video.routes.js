import { Router } from "express";
import {
  deleteVideo,
  getAllVideos,
  getVideoById,
  publishAVideo,
  togglePublishStatus,
  updateVideo,
  getMyVideos
} from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router
  .route("/")
  .get(getAllVideos) // get all videos for home screen
  .post(
    // publish a video
    upload.fields([
      {
        name: "videoFile",
        maxCount: 1,
      },
      {
        name: "thumbnail",
        maxCount: 1,
      },
    ]),
    publishAVideo
  );
router.route("/my-content").get(getMyVideos);

router
  .route("/:videoId")
  .get(getVideoById) // get video for particular clicking on particular video
  .delete(deleteVideo)
  .patch(upload.single("thumbnail"), updateVideo); //we can not update video just title and thumbnail can be updated

router.route("/toggle/publish/:videoId").patch(togglePublishStatus);

export default router;
