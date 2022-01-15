const mongoose = require("mongoose")
const Joi = require("joi")

const genreSchema = new mongoose.Schema({
  name: String,
})

const genreJoi = Joi.object({
  name: Joi.string().min(3).max(1000).required(),
})

const Genre = mongoose.model("Genre", genreSchema)

module.exports.Genre = Genre
module.exports.genreJoi = genreJoi
