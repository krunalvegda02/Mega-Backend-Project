import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if (!title && !description) {
    throw new ApiError(404, "Please provide details of the video");
  }

  const videoLocalFile = req.files?.videoFile[0]?.path;
  const thumbnailLocalFile = req.files?.thumbnail[0]?.path;
  if (!videoLocalFile && !thumbnailLocalFile) {
    throw new ApiError(404, "Video not found");
  }

  const videoFile = await uploadOnCloudinary(videoLocalFile);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalFile);
  if (!videoFile && !thumbnail) {
    throw new ApiError(404, "Video not uploadede on cloudinary");
  }

//   console.log("video duration:", videoFile);

  const publishVideo = await Video.create({
    title,
    description,
    thumbnail: thumbnailLocalFile,
    video: videoLocalFile,
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
  const { title, thumbnail, description } = req.body;

  if (!videoId) {
    throw new ApiError(404, "video not found");
  }

  const updatedVideo = await Video.findByIdAndUpdate(videoId, {
    $set: {
      title,
      thumbnail,
      description,
    },
  });
  if (!updatedVideo) {
    throw new ApiError(400, "Unable to update video");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(404, "video not found");
  }

  const deletedVideo = await Video.findByIdAndDelete(videoId);
  if (!deletedVideo) {
    throw new ApiError(400, "Unable to delete video");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, deletedVideo, "Video deleted successfully"));
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
