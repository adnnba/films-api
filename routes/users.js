const express = require("express")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")
const router = express.Router()
const { User, signupJoi, loginJoi, profileJoi } = require("../models/User")
const checkToken = require("../middleware/checkToken")
const checkAdmin = require("../middleware/checkAdmin")
const validateBody = require("../middleware/validateBody")

router.post("/signup", validateBody(signupJoi), async (req, res) => {
  try {
    const { firstName, lastName, email, password, avatar } = req.body

    const userFound = await User.findOne({ email })
    if (userFound) return res.status(400).send("user already registered")

    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(password, salt)

    const user = new User({
      firstName,
      lastName,
      email,
      password: hash,
      avatar,
      role: "User",
    })

    await user.save()

    delete user._doc.password

    res.json(user)
  } catch (error) {
    res.status(500).send(error.message)
  }
})

router.post("/add-admin", checkAdmin, validateBody(signupJoi), async (req, res) => {
  try {
    const { firstName, lastName, email, password, avatar } = req.body

    const userFound = await User.findOne({ email })
    if (userFound) return res.status(400).send("user already registered")

    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(password, salt)

    const user = new User({
      firstName,
      lastName,
      email,
      password: hash,
      avatar,
      role: "Admin",
    })

    await user.save()

    delete user._doc.password

    res.json(user)
  } catch (error) {
    res.status(500).send(error.message)
  }
})

router.post("/login", validateBody(loginJoi), async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email })
    if (!user) return res.status(404).send("user not found")

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(400).send("password incorrect")

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, { expiresIn: "15d" })

    res.send(token)
  } catch (error) {
    res.status(500).send(error.message)
  }
})

router.get("/profile", checkToken, async (req, res) => {
  const user = await User.findById(req.userId).select("-__v -password")
  res.json(user)
})

router.put("/profile", checkToken, validateBody(profileJoi), async (req, res) => {
  const { firstName, lastName, password, avatar } = req.body

  let hash
  if (password) {
    const salt = await bcrypt.genSalt(10)
    hash = await bcrypt.hash(password, salt)
  }

  const user = await User.findByIdAndUpdate(
    req.userId,
    { $set: { firstName, lastName, password: hash, avatar } },
    { new: true }
  ).select("-__v -password")

  res.json(user)
})

module.exports = router
