import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { extractPublicIdFromUrl } from "../utils/cloudinary.js";
import { v2 as cloudinary } from "cloudinary";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
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
    views: 0,
  });

  if (!publishVideo) {
    throw new ApiError(404, "Video not Found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, publishVideo, "Video Published Succesfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(404, "video not found");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "Video not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video Fetched succesfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;
  const thumbnail = req.file.path;

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
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
