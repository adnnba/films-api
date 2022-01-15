const express = require("express")
const checkAdmin = require("../middleware/checkAdmin")
const checkId = require("../middleware/checkId")
const checkToken = require("../middleware/checkToken")
const validateBody = require("../middleware/validateBody")
const validateId = require("../middleware/validateId")
const { Cast } = require("../models/Cast")
const { Comment, commentJoi } = require("../models/Comment")
const { Film, filmAddJoi, filmEditJoi, ratingJoi } = require("../models/Film")
const { Genre } = require("../models/Genre")
const { User } = require("../models/User")
const router = express.Router()

/* Films */

router.get("/", async (req, res) => {
  const films = await Film.find()
    .populate("actors")
    .populate("director")
    .populate("genres")
    .populate({
      path: "comments",
      populate: {
        path: "owner",
        select: "-password -email -likes -role",
      },
    })
  res.json(films)
})

router.get("/:id", checkId, async (req, res) => {
  try {
    const film = await Film.findById(req.params.id)
      .populate("actors")
      .populate("director")
      .populate("genres")
      .populate({
        path: "comments",
        populate: {
          path: "owner",
          select: "-password -email -likes -role",
        },
      })
    if (!film) return res.status(404).send("film not found")

    res.json(film)
  } catch (error) {
    console.log(error)
    res.status(500).send(error.message)
  }
})

router.post("/", checkAdmin, validateBody(filmAddJoi), async (req, res) => {
  try {
    const { title, description, poster, actors, director, genres } = req.body

    const actorsSet = new Set(actors)
    if (actorsSet.size < actors.length) return res.status(400).send("there is a duplicated actor")
    const actorsFound = await Cast.find({ _id: { $in: actors }, type: "Actor" })
    if (actorsFound.length < actors.length) return res.status(404).send("some of the actors is not found")

    const directorFound = await Cast.findOne({ _id: director, type: "Director" })
    if (!directorFound) return res.status(404).send("director not found")

    const genresSet = new Set(genres)
    if (genresSet.size < genres.length) return res.status(400).send("there is a duplicated genre")
    const genresFound = await Genre.find({ _id: { $in: genres } })
    if (genresFound.length < genres.length) return res.status(404).send("some of the genres is not found")

    const film = new Film({
      title,
      description,
      poster,
      actors,
      director,
      genres,
    })

    const promisesActors = actors.map(actorId => Cast.findByIdAndUpdate(actorId, { $push: { films: film._id } }))

    await Promise.all(promisesActors)

    await Cast.findByIdAndUpdate(director, { $push: { films: film._id } })

    await film.save()

    res.json(film)
  } catch (error) {
    console.log(error)
    res.status(500).send(error.message)
  }
})

router.put("/:id", checkAdmin, checkId, validateBody(filmEditJoi), async (req, res) => {
  try {
    const { title, description, poster, actors, director, genres } = req.body

    if (actors) {
      const actorsSet = new Set(actors)
      if (actorsSet.size < actors.length) return res.status(400).send("there is a duplicated actor")
      const actorsFound = await Cast.find({ _id: { $in: actors }, type: "Actor" })
      if (actorsFound.length < actors.length) return res.status(404).send("some of the actors is not found")
    }

    if (director) {
      const directorFound = await Cast.findOne({ _id: director, type: "Director" })
      if (!directorFound) return res.status(404).send("director not found")
    }

    if (genres) {
      const genresSet = new Set(genres)
      if (genresSet.size < genres.length) return res.status(400).send("there is a duplicated genre")
      const genresFound = await Genre.find({ _id: { $in: genres } })
      if (genresFound.length < genres.length) return res.status(404).send("some of the genres is not found")
    }

    const film = await Film.findByIdAndUpdate(
      req.params.id,
      { $set: { title, description, poster, actors, director, genres } },
      { new: true }
    )
    if (!film) return res.status(404).send("film not found")

    res.json(film)
  } catch (error) {
    console.log(error)
    res.status(500).send(error.message)
  }
})

router.delete("/:id", checkAdmin, checkId, async (req, res) => {
  try {
    await Comment.deleteMany({ filmId: req.params.id })

    const film = await Film.findByIdAndRemove(req.params.id)
    if (!film) return res.status(404).send("film not found")
    res.send("film is removed")
  } catch (error) {
    console.log(error)
    res.status(500).send(error.message)
  }
})

/* Comments */

router.get("/:filmId/comments", validateId("filmId"), async (req, res) => {
  try {
    const film = await Film.findById(req.params.filmId)
    if (!film) return res.status(404).send("film not found")

    const comments = await Comment.find({ filmId: req.params.filmId })
    res.json(comments)
  } catch (error) {
    console.log(error)
    res.status(500).send(error.message)
  }
})

router.post("/:filmId/comments", checkToken, validateId("filmId"), validateBody(commentJoi), async (req, res) => {
  try {
    const { comment } = req.body

    const film = await Film.findById(req.params.filmId)
    if (!film) return res.status(404).send("film not found")

    const newComment = new Comment({ comment, owner: req.userId, filmId: req.params.filmId })

    await Film.findByIdAndUpdate(req.params.filmId, { $push: { comments: newComment._id } })

    await newComment.save()

    res.json(newComment)
  } catch (error) {
    console.log(error)
    res.status(500).send(error.message)
  }
})

router.put(
  "/:filmId/comments/:commentId",
  checkToken,
  validateId("filmId", "commentId"),
  validateBody(commentJoi),
  async (req, res) => {
    try {
      const film = await Film.findById(req.params.filmId)
      if (!film) return res.status(404).send("film not found")
      const { comment } = req.body

      const commentFound = await Comment.findById(req.params.commentId)
      if (!commentFound) return res.status(404).send("comment not found")

      if (commentFound.owner != req.userId) return res.status(403).send("unauthorized action")

      const updatedComment = await Comment.findByIdAndUpdate(req.params.commentId, { $set: { comment } }, { new: true })

      res.json(updatedComment)
    } catch (error) {
      console.log(error)
      res.status(500).send(error.message)
    }
  }
)

router.delete("/:filmId/comments/:commentId", checkToken, validateId("filmId", "commentId"), async (req, res) => {
  try {
    const film = await Film.findById(req.params.filmId)
    if (!film) return res.status(404).send("film not found")

    const commentFound = await Comment.findById(req.params.commentId)
    if (!commentFound) return res.status(404).send("comment not found")

    const user = await User.findById(req.userId)

    if (user.role !== "Admin" && commentFound.owner != req.userId) return res.status(403).send("unauthorized action")

    await Film.findByIdAndUpdate(req.params.filmId, { $pull: { comments: commentFound._id } })

    await Comment.findByIdAndRemove(req.params.commentId)

    res.send("comment is removed")
  } catch (error) {
    console.log(error)
    res.status(500).send(error.message)
  }
})

/* Rating */

router.post("/:filmId/ratings", checkToken, validateId("filmId"), validateBody(ratingJoi), async (req, res) => {
  try {
    let film = await Film.findById(req.params.filmId)
    if (!film) return res.status(404).send("film not found")

    const { rating } = req.body

    const newRating = {
      rating,
      userId: req.userId,
    }

    const ratingFound = film.ratings.find(ratingObject => ratingObject.userId == req.userId)
    if (ratingFound) return res.status(400).send("user already rated this film")

    film = await Film.findByIdAndUpdate(req.params.filmId, { $push: { ratings: newRating } }, { new: true })

    let ratingSum = 0
    film.ratings.forEach(ratingObject => {
      ratingSum += ratingObject.rating
    })
    const ratingAverage = ratingSum / film.ratings.length

    await Film.findByIdAndUpdate(req.params.filmId, { $set: { ratingAverage } })

    res.send("rating added")
  } catch (error) {
    console.log(error)
    res.status(500).send(error.message)
  }
})

/* Likes */

router.get("/:filmId/likes", checkToken, validateId("filmId"), async (req, res) => {
  try {
    let film = await Film.findById(req.params.filmId)
    if (!film) return res.status(404).send("film not found")

    const userFound = film.likes.find(like => like == req.userId)
    if (userFound) {
      await Film.findByIdAndUpdate(req.params.filmId, { $pull: { likes: req.userId } })
      await User.findByIdAndUpdate(req.userId, { $pull: { likes: req.params.filmId } })

      res.send("removed like from film")
    } else {
      await Film.findByIdAndUpdate(req.params.filmId, { $push: { likes: req.userId } })
      await User.findByIdAndUpdate(req.userId, { $push: { likes: req.params.filmId } })
      res.send("film liked")
    }
  } catch (error) {
    console.log(error)
    res.status(500).send(error.message)
  }
})

module.exports = router
