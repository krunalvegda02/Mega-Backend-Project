import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const userId = req.user._id;

  // Check if the user is already subscribed to the channel
  const existingSubscription = await Subscription.findOne({
    subscriber: userId,
    channel: channelId,
  });

  if (existingSubscription) {
    // If subscribed, unsubscribe (delete the subscription)
    await existingSubscription.deleteOne();
    return res
      .status(200)
      .json(new ApiResponse(200, null, "Unsubscribed successfully"));
  } else {
    // If not subscribed, subscribe (create a new subscription)
    const newSubscription = new Subscription({
      subscriber: userId,
      channel: channelId,
    });
    await newSubscription.save();
    return res
      .status(200)
      .json(new ApiResponse(200, newSubscription, "Subscribed successfully"));
  }
});

// controller to return subscriber list of a channel     //!Follower List
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  console.log("subscriberId", channelId);

  // Find all subscriptions where the subscriber matches the subscriberId
  const subscriptions = await Subscription.find({
    //! subscription = we follow anyone
    channel : channelId,
  }).populate("channel", "fullname username");

  // Return all the channels to which this user is subscribed
  const channels = subscriptions.map((sub) => sub.channel);
  return res
    .status(200)
    .json(
      new ApiResponse(200, channels, "Subscribed channels fetched successfully")
    );
});

// controller to return channel list to which user has subscribed        //!Following List
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  // Find all subscriptions where the channel matches the channelId
  const subscriptions = await Subscription.find({
    subscriber: channelId,
  }).populate("subscriber", "username");
  // console.log("subscription", subscriptions);

  // Return all the subscribers
  const subscribers = subscriptions.map((sub) => sub.subscriber);
  return res
    .status(200)
    .json(
      new ApiResponse(200, subscribers, "Subscribers fetched successfully")
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
