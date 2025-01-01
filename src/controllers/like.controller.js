import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "Video ID is required");
  }

  const userId = req.user._id;

  // Find the existing like document (or create one if not exists)
  let like = await Like.findOne({ video: videoId });

  if (!like) {
    // If no like document exists for this video, create one
    like = new Like({
      video: videoId,
      likedBy: [userId],
    });
    await like.save();

    return res.status(200).json(new ApiResponse(200, like, "Video liked"));
  }

  // Check if user has already liked the video
  const alreadyLiked = like.likedBy.includes(userId);

  if (alreadyLiked) {
    // If already liked, remove the user from likedBy array
    like.likedBy = like.likedBy.pull(userId);
    await like.save();

    return res.status(200).json(new ApiResponse(200, like, "Like removed"));
  } else {
    // If not liked, add the user to likedBy array
    like.likedBy.push(userId);
    await like.save();
    return res.status(200).json(new ApiResponse(200, like, "Video liked"));
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!commentId) {
    throw new ApiError(400, "Invalid Comment id");
  }

  const userId = req.user._id;

  let comment = await Like.findOne({ comment: commentId });

  if (!comment) {
    comment = new Like({
      comment: commentId,
      likedBy: [userId],
    });
    await comment.save();
    return res.status(200).json(new ApiResponse(200, comment, "Comment liked"));
  }

  // Check if user has already liked the Comment
  const alreadyLiked = comment.likedBy.includes(userId);
  if (alreadyLiked) {
    // If already liked, remove the user from likedBy array
    comment.likedBy = comment.likedBy.pull(userId);
    await comment.save();

    return res
      .status(200)
      .json(new ApiResponse(200, comment, "Comment removed"));
  } else {
    // If not liked, add the user to likedBy array
    comment.likedBy.push(userId);
    await comment.save();
    return res.status(200).json(new ApiResponse(200, comment, "Comment liked"));
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  if (!tweetId) {
    throw new ApiError(400, "Invalid tweet id");
  }

  const userId = req.user._id;

  let tweet = await Like.findOne({ tweet: tweetId });

  if (!tweet) {
    tweet = new Like({
      tweet: tweetId,
      likedBy: [userId],
    });
    await tweet.save();
    return res.status(200).json(new ApiResponse(200, tweet, "tweet liked"));
  }

  // Check if user has already liked the Tweet
  const alreadyLiked = tweet.likedBy.includes(userId);
  if (alreadyLiked) {
    // If already liked, remove the user from likedBy array
    tweet.likedBy = tweet.likedBy.pull(userId);
    await tweet.save();

    return res.status(200).json(new ApiResponse(200, tweet, "tweet unliked"));
  } else {
    // If not liked, add the user to likedBy array
    tweet.likedBy.push(userId);
    await tweet.save();
    return res.status(200).json(new ApiResponse(200, tweet, "tweet liked"));
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const likedVideos = await Like.aggregate([
    {
      $match: {
        likedBy: userId, // Match the documents where likedBy contains the userId
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "videoDetails",
      },
    },
    {
      $unwind: "$videoDetails", // Unwind the videoDetails array to get individual video objects
    },
    {
      $project: {
        _id: 0, // Exclude the _id of the Like document
        video: "$videoDetails", // Include the video details from the lookup
      },
    },
  ]);

  if (!likedVideos || likedVideos.length === 0) {
    return res.status(404).json(new ApiResponse(404, "No liked videos found"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, likedVideos, "Liked Videos fetched"));
});

const getVideoLikes = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const likedVideos = await Like.find({ video: videoId });
  const likes = likedVideos.likedBy;

  const likedBy = likedVideos.length > 0 ? likedVideos[0].likedBy : [];
  const likesCount = likedBy.length;

  return res
    .status(200)
    .json(new ApiResponse(200, likesCount, "likes Fetched Succesfully"));
});

const getCommentLikes = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  const likedComments = await Like.find({ comment: commentId });
  const likes = likedComments.likedBy;

  const likedBy = likedComments.length > 0 ? likedComments[0].likedBy : [];
  const likesCount = likedBy.length;

  return res
    .status(200)
    .json(new ApiResponse(200, likesCount, "likes Fetched Succesfully"));
});

const getTweetLikes = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  const likedTweets = await Like.find({ tweet: tweetId });
  const likes = likedTweets.likedBy;

  const likedBy = likedTweets.length > 0 ? likedTweets[0].likedBy : [];
  const likesCount = likedBy.length;

  return res
    .status(200)
    .json(new ApiResponse(200, likesCount, "likes Fetched Succesfully"));
});

export {
  toggleCommentLike,
  toggleTweetLike,
  toggleVideoLike,
  getLikedVideos,
  getVideoLikes,
  getCommentLikes,
  getTweetLikes
};
