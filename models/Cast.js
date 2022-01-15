const mongoose = require("mongoose")
const Joi = require("joi")

const castSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  films: [
    {
      type: mongoose.Types.ObjectId,
      ref: "Film",
    },
  ],
  photo: String,
  type: {
    type: String,
    enum: ["Actor", "Director"],
  },
})

const castAddJoi = Joi.object({
  firstName: Joi.string().min(2).max(100).required(),
  lastName: Joi.string().min(2).max(100).required(),
  films: Joi.array().items(Joi.objectid()),
  photo: Joi.string().uri().min(5).max(1000).required(),
  type: Joi.string().valid("Actor", "Director").required(),
})

const castEditJoi = Joi.object({
  firstName: Joi.string().min(2).max(100),
  lastName: Joi.string().min(2).max(100),
  films: Joi.array().items(Joi.objectid()),
  photo: Joi.string().uri().min(5).max(1000),
  type: Joi.string().valid("Actor", "Director"),
})

const Cast = mongoose.model("Cast", castSchema)

module.exports.Cast = Cast
module.exports.castAddJoi = castAddJoi
module.exports.castEditJoi = castEditJoi
