const uuid = require("uuid/v4");
const HttpError = require("../models/http-error");
const getCoordsForAddress = require("../util/location");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const Place = require("../models/place");
const User = require("../models/user");

let DUMMY_PLACES = [
  {
    id: "p1",
    title: "Empire State",
    description:
      "Um lugar muito massa. inacreditavel, não tem como o sujeito deixar de gostar de um lugar top desses",
    location: {
      lat: 40.7484474,
      lng: -73.98711516
    },
    address: "20 W 34th St, New York",
    creator: "u1"
  }
];

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid; // {pid: 'p1'}
  let place;

  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find a place",
      500
    );

    return next(error);
  }
  // const place = DUMMY_PLACES.find(p => {
  //   return p.id === placeId;
  // });

  if (!place) {
    const error = new HttpError(
      "Could not find a place for the provided id.",
      404
    );

    return next(error);
  }

  console.log("GET Request in Places");
  res.json({ place: place.toObject({ getters: true }) });
};

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;
  let places;

  try {
    places = await Place.find({ creator: userId });
  } catch (err) {
    const error = new HttpError("Something went wrong in get places", 500);
    return next(error);
  }
  // const places = DUMMY_PLACES.filter(p => {
  //   return p.creator === userId;
  // });

  if (!places || places.length === 0) {
    const error = new HttpError(
      "Could not find a place for the provided user id.",
      404
    );

    return next(error);
  }

  console.log("GET Request in Places");
  res.json({ places: places.map(p => p.toObject({ getters: true })) });
};

const createPlace = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data", 422)
    );
  }

  const { title, description, address, creator } = req.body;

  let coordinates;
  try {
    coordinates = await getCoordsForAddress(address);
  } catch (error) {
    return next(error);
  }

  const createdPlace = new Place({
    title,
    description,
    address,
    location: coordinates,
    image: "http://teste.com",
    creator
  });

  let user;

  try {
    user = await User.findById(creator);
  } catch (err) {
    const error = new HttpError("Creating place failed, please try again", 500);
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Could not find user for provided id", 404);
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPlace.save({ session: sess });
    user.places.push(createdPlace);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError("Create place failed, please try again", 500);
    console.log(err);
    return next(error);
  }

  //DUMMY_PLACES.push(createdPlace);
  res.status(200).json({ place: createdPlace });
};

const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data", 422)
    );
  }

  const { title, description } = req.body;
  const placeId = req.params.pid;

  let place;

  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update place",
      500
    );

    return next(error);
  }

  // const updatedPlace = { ...DUMMY_PLACES.find(p => p.id === placeId) };
  // const placeIndex = DUMMY_PLACES.findIndex(p => p.id === placeId);

  place.title = title;
  place.description = description;

  try {
    await place.save();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update place",
      500
    );
    return next(error);
  }
  // DUMMY_PLACES[placeIndex] = updatedPlace;

  res.status(200).json({ place: place.toObject({ getters: true }) });
};

const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;

  try {
    place = await Place.findById(placeId).populate("creator");
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete place",
      500
    );
    return next(error);
  }

  if (!place) {
    const error = new HttpError("Could not find place for this id", 404);
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await place.remove({ session: sess });
    place.creator.places.pull(place);
    await place.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError("Could not delete place", 500);
    return next(error);
  }
  // if (!DUMMY_PLACES.find(p => p.id === placeId)) {
  //   throw new HttpError("Could not find a place for that id.", 404);
  // }

  // DUMMY_PLACES = DUMMY_PLACES.filter(p => p.id !== placeId);
  res.status(200).json({ message: "Deleted place." });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
