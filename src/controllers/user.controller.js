import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    console.log("refreshToken",refreshToken)
    await user.save({ validateBeforeSave: false }); //savind refreshtoken into database

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating Access and Refresh tokens"
    );
  }
};

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

const loginUser = asyncHandler(async (req, res) => {
  //req body -> data    //username or email
  const { email, username, password } = req.body;

  if (!(username || email)) {
    throw new ApiError(400, "username or password is must required");
  }

  //find the user
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User Not Found");
  }

  //password check
  //   console.log("isPasswordCorrect",isPasswordCorrect);

  const isPasswordCorrect = await user.isPasswordCorrect(password);

  if (isPasswordCorrect) {
    throw new ApiError(401, "Invalid User Credentials");
  }

  //access and refresh token
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  //send secure coookies
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      //Not needed..just for good practice...
      new ApiResponse(
        200,
        {
          //for cases while user wants to save cookie to local storage
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User Logged in Succesfully"
      )
    );
});

const logOutUser = asyncHandler(async (req, res) => {
  User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  //delete secure coookies
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logout seccessfully"));
});

export { registerUser, loginUser, logOutUser };
