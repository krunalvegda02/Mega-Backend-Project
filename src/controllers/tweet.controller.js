import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  const { content } = req.body;

  if (!content || content.trim().length === 0) {
    throw new ApiError(400, "Invalid Tweet");
  }

  const newTweet = new Tweet({
    content : content,   // Content of the tweet from the request body
    owner: req.user._id,  // Owner is the logged-in user, which should be in req.user._id
  });

  // Save the new tweet to the database
  await newTweet.save();

  return res.status(201).json(new ApiResponse(201, newTweet, "Tweet created successfully"));


});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
