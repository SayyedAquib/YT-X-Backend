import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  // TODO: toggle subscription

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel id");
  }

  const userId = req.user._id;

  if (!isValidObjectId(userId)) {
    throw new ApiError(401, "Unauthorized");
  }

  const existingSubscription = await Subscription.findOne({
    user: userId,
    channel: channelId,
  });

  if (existingSubscription) {
    // Unsubscribe
    await Subscription.findByIdAndDelete(existingSubscription._id);
    return ApiResponse.sendResponse(res, 200, "Unsubscribed successfully");
  }

  // Subscribe
  const newSubscription = Subscription.create({
    user: userId,
    channel: channelId,
  });

  if (!newSubscription) {
    throw new ApiError(500, "Failed to create subscription");
  }

  return ApiResponse.sendResponse(res, 200, "Subscribed successfully");
});

export { toggleSubscription };
