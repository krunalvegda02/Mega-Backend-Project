import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// const getVideoComments = asyncHandler(async (req, res) => {
//   //TODO: get all comments for a video
//   const { videoId } = req.params;
//   const { page = 1, limit = 10 } = req.query;

//   if (!mongoose.isValidObjectId(videoId)) {
//     throw new ApiError(400, "Invalid video ID");
//   }

//   const comments = await Comment.aggregate([
//     { $match: { video: mongoose.Types.ObjectId(videoId) } },
//     {
//       $lookup: {
//         from: "users", // Join with the User collection
//         localField: "owner",
//         foreignField: "_id",
//         as: "ownerDetails",
//       },
//     },
//     { $unwind: "$ownerDetails" }, // Flatten the owner details
//     {
//       $project: {
//         content: 1, // Include comment content
//         "ownerDetails.username": 1, // Include the owner's username
//         "ownerDetails.avatar": 1, // Include the owner's avatar (if available)
//       },
//     },
//   ])
//     .skip((page - 1) * limit) // Skip for pagination
//     .limit(parseInt(limit)); // Limit results per page

//   return res
//     .status(200)
//     .json(
//       ApiResponse(200, comments, "All Video comments fetched succefully")
//     );
// });

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  console.log("VIdeois", videoId);

  // const videoObjectId = new mongoose.Types.ObjectId(videoId);
  const comments = await Comment.find({ video: videoId }).populate("owner", "username avatar");
  const totalComments = await Comment.countDocuments({ video: videoId });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        comments,
        total: totalComments,
      },
      "All video comments fetched successfully"
    )
  );
});

const addComment = asyncHandler(async (req, res) => {
  const { comment } = req.body;
  const { videoId } = req.params;

  if (!comment || comment.trim().length === 0) {
    throw new ApiError(400, "Please type anything to add a comment");
  }

  const newComment = await Comment.create({
    content: comment,
    owner: req.user._id,
    video: videoId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, newComment, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  const { newComment } = req.body;
  const { commentId } = req.params;

  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: { content: newComment },
    },
    { new: true }
  );

  if (!updatedComment) {
    throw new ApiError(404, "Comment not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedComment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  const deletedComment = await Comment.findByIdAndDelete(commentId);
  if (!deletedComment) {
    throw new ApiError(404, "Comment not found");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, deletedComment, "Comment Deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
