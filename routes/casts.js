const express = require("express")
const checkAdmin = require("../middleware/checkAdmin")
const checkId = require("../middleware/checkId")
const validateBody = require("../middleware/validateBody")
const { Cast, castAddJoi, castEditJoi } = require("../models/Cast")
const router = express.Router()

router.get("/", async (req, res) => {
  const casts = await Cast.find()
  res.json(casts)
})

router.get("/actors", async (req, res) => {
  const actors = await Cast.find({ type: "Actor" })
  res.json(actors)
})

router.get("/directors", async (req, res) => {
  const directors = await Cast.find({ type: "Director" })
  res.json(directors)
})

router.post("/", checkAdmin, validateBody(castAddJoi), async (req, res) => {
  try {
    const { firstName, lastName, photo, type, films } = req.body

    const cast = new Cast({
      firstName,
      lastName,
      photo,
      type,
      films,
    })
    await cast.save()

    res.json(cast)
  } catch (error) {
    res.status(500).send(error.message)
  }
})

router.put("/:id", checkAdmin, checkId, validateBody(castEditJoi), async (req, res) => {
  try {
    const { firstName, lastName, photo, type, films } = req.body

    const cast = await Cast.findByIdAndUpdate(
      req.params.id,
      { $set: { firstName, lastName, photo, type, films } },
      { new: true }
    )
    if (!cast) return res.status(404).send("cast not found")

    res.json(cast)
  } catch (error) {
    res.status(500).send(error)
  }
})

router.delete("/:id", checkAdmin, checkId, async (req, res) => {
  try {
    const cast = await Cast.findByIdAndRemove(req.params.id)
    if (!cast) return res.status(404).send("cast not found")

    res.send("cast removed")
  } catch (error) {
    res.status(500).send(error)
  }
})

module.exports = router
