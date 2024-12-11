import { v2 as cloudinary } from "cloudinary";
import fs from "fs";               //Node File System

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    //upload file on cloudinary
    const uploadResult = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    console.log("FIle is Uploaded on Cloudinary:", uploadResult.url);
    console.log("UPLOAD CLOUDINARY RESULT", uploadResult);

    fs.unlinkSync(localFilePath);

    return uploadResult;
  } catch (error) {
    //removes the local saved temporary as the upload operation got failed
    fs.unlinkSync(localFilePath);
    return null;
  }
};

export { uploadOnCloudinary };
