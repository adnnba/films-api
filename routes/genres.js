const express = require("express")
const checkAdmin = require("../middleware/checkAdmin")
const checkId = require("../middleware/checkId")
const validateBody = require("../middleware/validateBody")
const { Genre, genreJoi } = require("../models/Genre")
const router = express.Router()

router.get("/", async (req, res) => {
  const genres = await Genre.find()
  res.json(genres)
})

router.post("/", checkAdmin, validateBody(genreJoi), async (req, res) => {
  try {
    const { name } = req.body

    const genre = new Genre({
      name,
    })
    await genre.save()

    res.json(genre)
  } catch (error) {
    res.status(500).send(error.message)
  }
})

router.put("/:id", checkAdmin, checkId, validateBody(genreJoi), async (req, res) => {
  try {
    const { name } = req.body

    const genre = await Genre.findByIdAndUpdate(req.params.id, { $set: { name } }, { new: true })
    if (!genre) return res.status(404).send("genre not found")

    res.json(genre)
  } catch (error) {
    res.status(500).send(error)
  }
})

router.delete("/:id", checkAdmin, checkId, async (req, res) => {
  try {
    const genre = await Genre.findByIdAndRemove(req.params.id)
    if (!genre) return res.status(404).send("genre not found")

    res.send("genre removed")
  } catch (error) {
    res.status(500).send(error)
  }
})

module.exports = router
