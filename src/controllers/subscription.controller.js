import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel id");
  }

  const userId = req.user._id;

  if (!isValidObjectId(userId)) {
    throw new ApiError(401, "Unauthorized");
  }

  const existingSubscription = await Subscription.findOne({
    subscriber: userId,
    channel: channelId,
  });

  if (existingSubscription) {
    // Unsubscribe
    await Subscription.findByIdAndDelete(existingSubscription._id);
    return res
      .status(200)
      .json(new ApiResponse(200, null, "Unsubscribed successfully"));
  }

  // Subscribe
  const newSubscription = await Subscription.create({
    subscriber: userId,
    channel: channelId,
  });

  if (!newSubscription) {
    throw new ApiError(500, "Failed to create subscription");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, newSubscription, "Subscribed successfully"));
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel id");
  }

  const subscribers = await Subscription.find({ channel: channelId })
    .populate("subscriber", "username fullName avatar") // Populate subscriber details
    .exec();

  if (!subscribers) {
    throw new ApiError(404, "Subscribers not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, subscribers, "Subscribers retrieved successfully")
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Invalid subscriber id");
  }

  const subscriptions = await Subscription.find({ subscriber: subscriberId })
    .populate("channel", "username fullName avatar") // Populate channel details
    .exec();

  if (!subscriptions) {
    throw new ApiError(404, "Subscribed channels not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscriptions,
        "Subscribed channels retrieved successfully"
      )
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
