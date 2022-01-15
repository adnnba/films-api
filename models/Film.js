const mongoose = require("mongoose")
const Joi = require("joi")

const ratingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    ref: "User",
  },
  rating: Number,
})

const filmSchema = new mongoose.Schema({
  title: String,
  description: String,
  poster: String,
  ratings: [ratingSchema],
  ratingAverage: {
    type: Number,
    default: 0,
  },
  comments: [
    {
      type: mongoose.Types.ObjectId,
      ref: "Comment",
    },
  ],
  actors: [
    {
      type: mongoose.Types.ObjectId,
      ref: "Cast",
    },
  ],
  director: {
    type: mongoose.Types.ObjectId,
    ref: "Cast",
  },
  likes: [
    {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
  ],
  genres: [
    {
      type: mongoose.Types.ObjectId,
      ref: "Genre",
    },
  ],
})

const filmAddJoi = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  description: Joi.string().min(5).max(1000).required(),
  poster: Joi.string().uri().min(5).max(1000).required(),
  actors: Joi.array().items(Joi.objectid()).min(1).required(),
  director: Joi.objectid().required(),
  genres: Joi.array().items(Joi.objectid()).min(1).required(),
})

const filmEditJoi = Joi.object({
  title: Joi.string().min(1).max(200),
  description: Joi.string().min(5).max(1000),
  poster: Joi.string().uri().min(5).max(1000),
  actors: Joi.array().items(Joi.objectid()).min(1),
  director: Joi.objectid(),
  genres: Joi.array().items(Joi.objectid()).min(1),
})

const ratingJoi = Joi.object({
  rating: Joi.number().min(0).max(5).required(),
})

const Film = mongoose.model("Film", filmSchema)

module.exports.Film = Film
module.exports.filmAddJoi = filmAddJoi
module.exports.filmEditJoi = filmEditJoi
module.exports.ratingJoi = ratingJoi
