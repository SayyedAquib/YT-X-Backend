import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  let { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  page = isNaN(page) ? 1 : Number(page);
  limit = isNaN(limit) ? 10 : Number(limit);
  if (page <= 0) {
    page = 1;
  }
  if (limit <= 0) {
    page = 10;
  }

  const matchStage = {};
  if (userId && isValidObjectId(userId)) {
    matchStage["$match"] = {
      owner: new mongoose.Types.ObjectId(userId),
    };
  } else if (query) {
    matchStage["$match"] = {
      $or: [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ],
    };
  } else {
    matchStage["$match"] = {};
  }

  if (userId && query) {
    matchStage["$match"] = {
      $and: [
        { owner: new mongoose.Types.ObjectId(userId) },
        {
          $or: [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } },
          ],
        },
      ],
    };
  }

  const joinOwnerStage = {
    $lookup: {
      from: "users",
      localField: "owner",
      foreignField: "_id",
      as: "owner",
      pipeline: [
        {
          $project: {
            username: 1,
            avatar: 1,
            fullname: 1,
          },
        },
      ],
    },
  };

  const addFieldStage = {
    $addFields: {
      owner: {
        $first: "$owner",
      },
    },
  };

  const sortStage = {};
  if (sortBy && sortType) {
    sortStage["$sort"] = {
      [sortBy]: sortType === "asc" ? 1 : -1,
    };
  } else {
    sortStage["$sort"] = {
      createdAt: -1,
    };
  }

  const skipStage = { $skip: (page - 1) * limit };
  const limitStage = { $limit: limit };

  const videos = await Video.aggregate([
    matchStage,
    joinOwnerStage,
    addFieldStage,
    sortStage,
    skipStage,
    limitStage,
  ]);

  res.status(200).json(new ApiResponse(200, videos, "Get videos success"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if ([title, description].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const videoLocalPath = req.files?.videoFile[0]?.path;

  if (!videoLocalPath) {
    throw new ApiError(400, "Video file is required");
  }

  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail is required");
  }

  const videoFile = await uploadOnCloudinary(videoLocalPath);

  if (!videoFile) {
    throw new ApiError(400, "Error uploading video");
  }

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!thumbnail) {
    throw new ApiError(400, "Error uploading thumbnail");
  }

  const uploadedVideo = await Video.create({
    title,
    description,
    videoFile: videoFile?.url,
    thumbnail: thumbnail?.url,
    duration: videoFile?.duration,
    owner: req.user._id,
  });

  if (!uploadedVideo) {
    throw new ApiError(400, "Error while creating video object in DB");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, uploadedVideo, "Video published successfully."));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Video ID is required.");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video does not exist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { video }, "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Video ID is required.");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video does not exist");
  }

  const { title, description, thumbnail } = video;

  const thumbnailLocalPath = req.file?.path;

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail file is required");
  }

  const cloudinaryThumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!cloudinaryThumbnail.url) {
    throw new ApiError(400, "Error while uploading on thumbnail");
  }

  await deleteFromCloudinary(thumbnail);

  const updatedVideoDetails = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title,
        description,
        thumbnail: cloudinaryThumbnail?.url,
      },
    },
    { new: true }
  );

  if (!updatedVideoDetails) {
    throw new ApiError(404, "Video does not exist");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedVideoDetails,
        "Video details updated successfully"
      )
    );
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Video ID is required.");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video does not exist");
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not allowed to delete this video");
  }

  const cloudinaryVideoDeletedResponse = await deleteFromCloudinary(
    video.videoFile,
    "video"
  );

  if (cloudinaryVideoDeletedResponse.result !== "ok") {
    throw new ApiError(400, "Error while deleting video file");
  }

  const cloudinaryThumbnailDeletedResponse = await deleteFromCloudinary(
    video.thumbnail
  );

  if (cloudinaryThumbnailDeletedResponse.result !== "ok") {
    throw new ApiError(400, "Error while deleting thumbnail");
  }

  const deleteVideo = await Video.findByIdAndDelete(videoId);

  if (!deleteVideo) {
    throw new ApiError(500, "Error while deleting video");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Video ID is required.");
  }

  const video = await Video.findById(videoId);

  const { isPublised } = video;

  if (!video) {
    throw new ApiError(404, "Video does not exist");
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not allowed to change publish status");
  }

  const updatedPublishStatus = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublised: !isPublised,
      },
    },
    { new: true }
  );

  if (!updatedPublishStatus) {
    throw new ApiError(500, "Error while updating publish status");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { updatedPublishStatus },
        "Publish status updated successfully"
      )
    );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
