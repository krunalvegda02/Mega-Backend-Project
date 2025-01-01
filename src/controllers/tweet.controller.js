import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
// import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;

  if (!content || content.trim().length === 0) {
    throw new ApiError(400, "Invalid Tweet");
  }

  const newTweet = new Tweet({
    content: content,
    owner: req.user._id,
  });

  // Save the new tweet to the database
  await newTweet.save();

  return res
    .status(200)
    .json(new ApiResponse(200, newTweet, "Tweet created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  const  {userId}  = req.params;
  console.log("user", userId);

  const userTweets = await Tweet.find({ owner: userId }).populate("owner", "avatar username fullname");
  // .aggregate([
  //   {
  //     $match: { owner: user },
  //   },
  //   {
  //     $lookup: {
  //       from: "users",
  //       localField: "owner",
  //       foreignField: "_id",
  //       as: "ownerDetails",
  //     },
  //   },
  //   {
  //     $unwind: "$ownerDetails", // If you want to flatten the resulting array
  //   },
  //   {
  //     $project: {
  //       content: 1, // Select the tweet content
  //       "ownerDetails.fullName": 1, // Select the full name from the user document
  //       "ownerDetails.username": 1,
  //       "ownerDetails.avatar": 1,
  //       createdAt: 1, // Select the username from the user document
  //     },
  //   },
  // ]);

  return res
    .status(200)
    .json(new ApiResponse(200, userTweets, "Tweets fetched successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  const tweetId = req.params.tweetId;
  const { newContent } = req.body;

  if (!newContent || newContent.trim().length === 0) {
    throw new ApiError(400, "Tweet is empty");
  }

  const updatedTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      $set: {
        content: newContent,
      },
    },
    { new: true }
  );

  if (!updatedTweet) {
    throw new ApiError(404, "Tweet not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedTweet, "Tweet Updated Succesfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  const tweetId = req.params.tweetId;

  const deletedTweet = await Tweet.findByIdAndDelete(tweetId);

  if (!deletedTweet) {
    throw new ApiError(404, "Tweet not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, deletedTweet, "Tweet Deleted Succesfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
