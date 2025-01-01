import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { extractPublicIdFromUrl } from "../utils/cloudinary.js";
import { v2 as cloudinary } from "cloudinary";

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 12,
    query = "",
    sortBy = "createdAt",
    sortType = "desc",
    userId,
  } = req.query;

  // Pagination settings
  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);
  const skip = (pageNumber - 1) * limitNumber;

  // Building the query
  const filters = { isPublished: true };
  if (query) {
    filters.$or = [
      { title: { $regex: query, $options: "i" } }, // Case-insensitive search in title
      { description: { $regex: query, $options: "i" } }, // Case-insensitive search in description
    ];
  }
  if (userId) {
    filters.owner = userId; // Filter videos by owner
  }

  // Sorting settings
  const sortOptions = { [sortBy]: sortType === "asc" ? 1 : -1 };

  // Fetching videos
  const totalVideos = await Video.countDocuments(filters);
  // Total number of matching videos
  // Fetching videos with userDetails using aggregation
  const videosWithUserDetails = await Video.aggregate([
    { $match: filters },
    { $sort: sortOptions },
    { $skip: skip },
    { $limit: limitNumber },
    {
      $lookup: {
        from: "users", // Name of the user collection
        localField: "owner", // Field in Video collection
        foreignField: "_id", // Field in User collection
        as: "userDetails", // Alias for the joined data
      },
    },
    {
      $unwind: "$userDetails", // Flatten the userDetails array
    },
    {
      $project: {
        _id: 1,
        title: 1,
        description: 1,
        thumbnail: 1,
        views: 1,
        createdAt: 1,
        "userDetails.avatar": 1, // Include specific user fields
        "userDetails.username": 1,
      },
    },
  ]);
  // Response
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        total: totalVideos,
        page: pageNumber,
        limit: limitNumber,
        videos: videosWithUserDetails,
      },
      "Videos fetched successfully"
    )
  );
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  console.log(req.files);

  const videoLocalFile = req.files?.videoFile[0]?.path;
  const thumbnailLocalFile = req.files?.thumbnail[0]?.path;

  if (!title && !description) {
    throw new ApiError(404, "Please provide details of the video");
  }

  if (!videoLocalFile && !thumbnailLocalFile) {
    throw new ApiError(404, "Video not found");
  }

  const videoFile = await uploadOnCloudinary(videoLocalFile);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalFile);
  if (!videoFile && !thumbnail) {
    throw new ApiError(404, "Video not uploadede on cloudinary");
  }

  console.log("video duration:", videoFile);

  const publishVideo = await Video.create({
    title,
    description,
    thumbnail: thumbnail.url,
    video: videoFile.url,
    owner: req.user._id,
    isPublished: true,
    duration: videoFile.duration,
  });

  if (!publishVideo) {
    throw new ApiError(404, "Video not Found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, publishVideo, "Video Published Succesfully"));
});

const getMyVideos = asyncHandler(async (req, res) => {
  const userid = req.user._id;

  const myVideos = await Video.aggregate([
    {
      $match: {
        owner: userid,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "userDetails",
      },
    },
    {
      $unwind: "$userDetails",
    },
    {
      $project: {
        _id: 1,
        title: 1,
        description: 1,
        thumbnail: 1,
        views: 1,
        createdAt: 1,
        "userDetails.avatar": 1,
        "userDetails.username": 1,
      },
    },
  ]);
  if (!myVideos) {
    return res
      .status(200)
      .json(new ApiResponse(200, "User Does Not Publish any Video"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { myVideos }, "My Video Fetched Succesfully"));
});

const channelVideos = asyncHandler(async (req, res) => {
  const { channelid } = req.params;
  console.log("channelid", channelid);

  const myVideos = await Video.find({ owner: channelid }).populate(
    "owner",
    "username avatar"
  );
  // .aggregate([
  //   {
  //     $match: {
  //       owner: channelid,
  //     },
  //   },
  //   {
  //     $lookup: {
  //       from: "users",
  //       localField: "owner",
  //       foreignField: "_id",
  //       as: "userDetails",
  //     },
  //   },
  //   {
  //     $unwind: "$userDetails",
  //   },
  //   {
  //     $project: {
  //       _id: 1,
  //       title: 1,
  //       description: 1,
  //       thumbnail: 1,
  //       views: 1,
  //       createdAt: 1,
  //       "userDetails.avatar": 1,
  //       "userDetails.username": 1,
  //     },
  //   },
  // ]);
  if (!myVideos) {
    return res
      .status(200)
      .json(new ApiResponse(200, "Channel Does Not Publish any Video"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { myVideos }, "My Video Fetched Succesfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { videoId } = req.params;

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "Video not found");
  }

  const user = await User.findById(video.owner).select(
    " -password -refreshToken"
  );
  console.log("User", user);

  // const hasViewed = userId && video.views.includes(userId);
  // if (!hasViewed) {
  //   user.watchHistory.push(videoId);
  //   video.views.push(userId); // Add user ID to the views array
  //   await video.save(); // Save changes to the database
  //   await user.save();
  // }

  // Add videoId to watchHistory if it doesn't already exist
  const addVideoToHistory = await User.findByIdAndUpdate(
    userId,
    { $addToSet: { watchHistory: videoId } }, //add to set for Avoid duplicates
    { new: true }
  );

  // Add userId to video views if not already present
  const videoUpdate = await Video.findByIdAndUpdate(
    videoId,
    { $addToSet: { views: userId } },
    { new: true }
  );

  // Total views = number of unique users who watched the video
  const totalViews = videoUpdate.views.length;

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { video: videoUpdate, totalViews, user },
        "Video Fetched succesfully"
      )
    );
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;

  const thumbnail = req?.file?.path || null;
  console.log("thumbnial", thumbnail.path);

  if (!videoId) {
    throw new ApiError(404, "video not found");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "Unable to update video");
  }
  //   console.log("video.thumbnail", video.thumbnail);
  let newThumbnailUrl = null;
  // Deleting old thumbnail if a new one is provided
  if (thumbnail && video.thumbnail) {
    const oldThumbnail = await extractPublicIdFromUrl(video.thumbnail);
    // console.log(" old thumbnail", oldThumbnail);

    try {
      const deletion = await cloudinary.uploader.destroy(oldThumbnail);
      console.log("Thumbnail deletion:", deletion);
      const newThumbnail = await uploadOnCloudinary(thumbnail);
      newThumbnailUrl = newThumbnail.url;
    } catch (error) {
      console.error("Failed to delete old thumbnail:", error);
    }
  }

  if (title) {
    video.title = title;
  }
  if (description) {
    video.description = description;
  }
  if (newThumbnailUrl) {
    video.thumbnail = newThumbnailUrl;
  }

  const updatedVideo = await video.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(404, "video not found");
  }

  // Find the video in the database
  const videoDetails = await Video.findById(videoId);
  if (!videoDetails) {
    throw new ApiError(404, "Video not found");
  }

  // Extract the public IDs from the video URL and thumbnail URL
  const CloudinaryVideoId = extractPublicIdFromUrl(videoDetails.video);
  const CloudinaryThumbnailId = extractPublicIdFromUrl(videoDetails.thumbnail);

  console.log("Cloudinary Video ID:", CloudinaryVideoId); // Log the video public ID
  console.log("Cloudinary Thumbnail ID:", CloudinaryThumbnailId); // Log the thumbnail public ID

  // Deleting the video from Cloudinary
  const videoDeletion = await cloudinary.uploader.destroy(CloudinaryVideoId, {
    resource_type: "video",
  });
  console.log("Video Deletion Result:", videoDeletion);

  // Deleting the thumbnail from Cloudinary
  const thumbnailDeletion = await cloudinary.uploader.destroy(
    CloudinaryThumbnailId
  );
  console.log("Thumbnail Deletion Result:", thumbnailDeletion);

  //Delete the video record from the database
  const deletedVideo = await Video.findByIdAndDelete(videoId);
  if (!deletedVideo) {
    throw new ApiError(400, "Unable to delete video from the database");
  }

  // Respond with success
  return res
    .status(200)
    .json(new ApiResponse(200, deletedVideo, "User deleted Successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(404, "video not found");
  }

  const videoDetails = await Video.findById(videoId);
  const PublishStatus = videoDetails.isPublished;
  //   console.log("PublishStatus", PublishStatus);

  videoDetails.isPublished = !videoDetails.isPublished;
  await videoDetails.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, videoDetails, "IsPublish Toggled"));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
  getMyVideos,
  channelVideos,
};
