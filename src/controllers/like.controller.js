import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const userId = req.user._id;

  if (!isValidObjectId(userId)) {
    throw new ApiError(401, "Unauthorized");
  }

  const existingLike = await Like.findOne({ video: videoId, likedBy: userId });

  if (existingLike) {
    await Like.findByIdAndDelete(existingLike._id);
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Like removed successfully"));
  }

  const like = await Like.create({ video: videoId, likedBy: userId });

  if (!like) {
    throw new ApiError(400, "Error while creating like object in DB");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, like, "Like added successfully"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment id");
  }

  const userId = req.user._id;

  if (!isValidObjectId(userId)) {
    throw new ApiError(401, "Unauthorized");
  }

  const existingLike = await Like.findOne({
    comment: commentId,
    likedBy: userId,
  });

  if (existingLike) {
    await Like.findByIdAndDelete(existingLike._id);
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Like removed successfully"));
  }

  const like = await Like.create({ comment: commentId, likedBy: userId });

  if (!like) {
    throw new ApiError(400, "Error while creating like object in DB");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, like, "Like added successfully"));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet id");
  }

  const userId = req.user._id;

  if (!isValidObjectId(userId)) {
    throw new ApiError(401, "Unauthorized");
  }

  const existingLike = await Like.findOne({ tweet: tweetId, likedBy: userId });

  if (existingLike) {
    await Like.findByIdAndDelete(existingLike._id);
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Like removed successfully"));
  }

  const like = await Like.create({ tweet: tweetId, likedBy: userId });

  if (!like) {
    throw new ApiError(400, "Error while creating like object in DB");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, like, "Like added successfully"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  if (!isValidObjectId(userId)) {
    throw new ApiError(401, "Unauthorized");
  }

  const likedVideo = await Like.aggregate(
    [
      {
        $match: { likedBy: userId },
      },
      {
        $lookup: {
          from: "videos",
          localField: "video",
          foreignField: "_id",
          as: "likedVideos",
        },
      },
      {
        $unwind: "$likedVideos",
      },
      {
        $project: {
          _id: 0,
          video: "$likedVideos._id",
          title: "$likedVideos.title",
          description: "$likedVideos.description",
          createdAt: "$likedVideos.createdAt",
          thumbnail: "$likedVideos.thumbnail",
        },
      },
    ]
  )

  if (!likedVideo) {
    throw new ApiError(404, "No liked videos found");
  }

  return res
   .status(200)
   .json(new ApiResponse(200, likedVideo, "Liked videos fetched successfully"));
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
