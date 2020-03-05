const uuid = require("uuid/v4");
const HttpError = require("../models/http-error");
const { validationResult } = require("express-validator");
const User = require("../models/user");

const DUMMY_USERS = [
  {
    id: "u1",
    name: "Renan Alves",
    email: "teste@teste.com",
    password: "senha123"
  }
];

const getUsers = async (req, res, next) => {
  let users;

  try {
    users = await User.find({}, "-password");
  } catch (err) {
    const error = new HttpError(
      "Fetching users failed, please try again later",
      500
    );
    return next(error);
  }
  res.json({ users: users.map(user => user.toObject({ getters: true })) });
};
const signup = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data", 422)
    );
  }

  const { name, email, password } = req.body;

  let existingUser;

  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError("Sign up failed, please try again", 500);
    return next(error);
  }

  if (existingUser) {
    const error = new HttpError("User exist already, please log instead", 422);
    return next(error);
  }

  const createdUser = new User({
    name,
    email,
    image: "https://imagemteste.com",
    password,
    places: []
  });

  try {
    await createdUser.save();
  } catch (err) {
    const error = new HttpError("SingUp failed, please try again", 500);
    return next(error);
  }

  res.status(201).json({ user: createdUser.toObject({ getters: true }) });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;

  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError("Log in failed, please try again", 500);
    return next(error);
  }

  if (!existingUser || existingUser.password != password) {
    const error = new HttpError("Invalid credentials, could not log you");
    return next(error);
  }

  res.json({ message: "Logged in" });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
