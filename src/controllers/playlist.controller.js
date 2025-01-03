import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  console.log("req body", req.body);

  if (!name) {
    throw new ApiError(400, "Please Provide a name of Playlist");
  }
  if (!description) {
    throw new ApiError(400, "Please Provide a Description of Playlist");
  }

  const userId = req.user._id;
  const createPlaylist = await Playlist.create({
    name,
    description,
    owner: userId,
    videos: [],
  });
  console.log("createPlaylist", createPlaylist);

  return res
    .status(200)
    .json(new ApiResponse(200, createPlaylist, "Playlist Created Succesfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const playlists = await Playlist.find({ owner: userId })
  .populate("videos", "thumbnail")  

  return res
    .status(200)
    .json(new ApiResponse(200, playlists, "All playlists fetched succesfully"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  const playlistById = await Playlist.findById(playlistId);
  if (!playlistById) {
    throw new ApiError(404, "Playlist not Found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlistById, "Playlist fetched succesfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!playlistId && !videoId) {
    throw new ApiError(400, "PlayListId and Video are must required..");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found.");
  }

  // Check if the video already exists in the playlist
  if (playlist.videos.includes(videoId)) {
    throw new ApiError(400, "Video already exists in the playlist.");
  }

  playlist.videos.push(videoId);
  await playlist.save();

  return res
    .status(200)
    .json(new ApiResponse(200, Playlist, "Video Added Succesfully"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!playlistId && !videoId) {
    throw new ApiError(400, "PlayListId and Video are must required..");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found.");
  }

  //   Check if the video not exists in the playlist
  if (!playlist.videos.includes(videoId)) {
    throw new ApiError(400, "Video not exists in the playlist.");
  }

  const deletedVideo = playlist.videos.pull(videoId);
  await playlist.save();
  return res
    .status(200)
    .json(new ApiResponse(200, deletedVideo, "Video deleted Succsfully"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  console.log("playlistid",playlistId);
  
  if (!playlistId) {
    throw new ApiError(400, "Playlist not Found");
  }

  const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);
  if (!deletedPlaylist) {
    throw new ApiError(404, "Playlist not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, deletedPlaylist, "Playlist deleted Successfully")
    );
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  if (!playlistId) {
    throw new ApiError(400, "Playlist not found");
  }

  if (!name && !description) {
    throw new ApiError(400, "Please enter values for update");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found.");
  }
  //Updating the PLaylist
  if (name) {
    playlist.name = name;
  }
  if (description) {
    playlist.description = description;
  }
  await playlist.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlost Updated Succesfully"));
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
