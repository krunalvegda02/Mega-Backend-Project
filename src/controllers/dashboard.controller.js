import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

// Get the channel stats like total video views, total subscribers, total videos, total likes etc.
const getChannelStats = asyncHandler(async (req, res) => {
  const channelId = req.user._id;

  const userdata = await User.findById(channelId);
  if (!userdata) {
    throw new ApiError(401, "user not found!");
  }

  const totalSubscribers = await Subscription.countDocuments({
    channel: channelId,
  });

  const totalVideos = await Video.find({ owner: channelId });
  // const totalLikes = await Like.find({ owner: channelId });

  const totalLikes = await Like.aggregate([
    {
      $match: {
        video: {
          $in: (await Video.find({ owner: channelId }).select("_id")) // Fetch only the _id field
            .map((video) => video._id), // Extract the _id values into an array
        },
      },
    },
    {
      $unwind: "$likedBy",
    },
    {
      $count: "totalLikes",
    },
  ]);

  // video:

  // ! views is array so find that is sum will work here or not cz output is always 0
  const totalViews = await Video.aggregate([
    { $match: { owner: channelId } },
    { $unwind: "$views" },
    { $count: "totalViews" },
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        userdata,
        totalSubscribers,
        totalVideos,
        totalLikes,
        totalViews,
      },
      "Channel stats fetched successfully"
    )
  );
});

const getChannelVideos = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  // console.log("Fetching videos for user: ", userId);

  const videos = await Video.aggregate([
    {
      $match: { owner: userId },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    { $unwind: { path: "$likes", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        title: 1,
        // description: 1,
        // video: 1,
        thumbnail: 1,
        // views: 1,
        isPublished: 1,
        createdAt: 1,
        // updatedAt: 1,
        likes: { $size: { $ifNull: ["$likes.likedBy", []] } },
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "All channel videos"));
});

export { getChannelStats, getChannelVideos };
