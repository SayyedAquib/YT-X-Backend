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

  console.log("channelId", channelId);

  // if (!isValidObjectId(channelId)) {
  //   throw new ApiError(400, "Invalid channel id");
  // }

  // const subscribers = await Subscription.aggregate([
  //   {
  //     $match: {
  //       channel: new mongoose.Types.ObjectId(channelId),
  //     },
  //   },
  //   {
  //     $lookup: {
  //       from: "users",
  //       localField: "subscriber",
  //       foreignField: "_id",
  //       as: "subscribersDetails",
  //     },
  //   },
  //   {
  //     $project: {
  //       subscribersDetails: 1,
  //       fullName: 1,
  //       avatar: 1,
  //     },
  //   },
  // ]);

  // if (!subscribers.length) {
  //   throw new ApiError(404, "No subscribers found");
  // }

  // return res
  //   .status(200)
  //   .json(
  //     new ApiResponse(200, subscribers, "Subscribers fetched successfully")
  //   );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  console.log("subscriberId", subscriberId);

  // if (!isValidObjectId(subscriberId)) {
  //   throw new ApiError(400, "Invalid subscriber id");
  // }

  // const channels = await Subscription.aggregate([
  //   {
  //     $match: {
  //       subscriber: new mongoose.Types.ObjectId(subscriberId),
  //     },
  //   },
  //   {
  //     $lookup: {
  //       from: "users",
  //       localField: "channel",
  //       foreignField: "_id",
  //       as: "channelsDetails",
  //     },
  //   },
  //   {
  //     $project: {
  //       channelsDetails: 1,
  //       fullName: 1,
  //       avatar: 1,
  //     },
  //   },
  // ]);

  // if (!channels.length) {
  //   throw new ApiError(404, "No channels found");
  // }

  // return res
  //   .status(200)
  //   .json(new ApiResponse(200, channels, "Channels fetched successfully"));
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
