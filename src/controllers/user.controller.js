import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  //get use details from frontend
  const { fullname, username, email, password } = req.body;
  //   console.log("emila:", email, "\n password: ", password);

  //validaiton
  if (
    [fullname, username, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are must required");
  }

  //check if user already exist: username, email
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User already exists");
  }

  //cheek for imagis and avatar
  const avatarLocalPath = req.files?.avatar[0]?.path;

  //   const coverImageLocalPath = req.files?.coverImage[0]?.path;          //if avatar image is null then it shows undifined error
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files?.coverImage[0]?.path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar Image is must required");
  }
  console.log("Avatar:", req.files);
  //upload to cloudinary, check avatar
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) throw new ApiError(400, "avatar image is must required");

  // create user object
  const user = await User.create({
    fullname,
    username: username.toLowerCase(),
    email,
    avatar: avatar.url,
    coverImage: "" || coverImage?.url,
    password,
  });

  // remove pasword andd refresh token field from response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  console.log(createdUser);

  //check if user is created or not
  if (!createdUser) {
    throw new ApiError(500, "error while regostering user");
  }

  //return result
  return res
    .status(200)
    .json(new ApiResponse(200, createdUser, "Isr registered succesfully"));
});

export { registerUser };
