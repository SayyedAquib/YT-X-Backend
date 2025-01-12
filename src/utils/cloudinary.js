import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { ApiError } from "./ApiError.js";
import { ApiResponse } from "./ApiResponse.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    // console.log("Response: ", response);

    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath);

    return new ApiError(500, "Failed to upload file to Cloudinary");
  }
};

const deleteFromCloudinary = async (url) => {
  if (!url) return null;

  const publicId = url.split("/").pop().split(".")[0];

  try {
    await cloudinary.uploader.destroy(publicId);

    return new ApiResponse(200, null, "File deleted from Cloudinary");
  } catch {
    throw new ApiError(500, "Failed to delete file from Cloudinary");
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
