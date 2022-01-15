const express = require("express")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")
const nodemailer = require("nodemailer")
const router = express.Router()
const { User, signupJoi, loginJoi, profileJoi, forgotPasswordJoi, resetPasswordJoi } = require("../models/User")
const { Comment } = require("../models/Comment")
const checkToken = require("../middleware/checkToken")
const checkAdmin = require("../middleware/checkAdmin")
const validateBody = require("../middleware/validateBody")
const checkId = require("../middleware/checkId")

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
      emailVerified: false,
      role: "User",
    })

    const transporter = nodemailer.createTransport({
      service: "gmail",
      port: 587,
      secure: false,
      auth: {
        user: process.env.SENDER_EMAIL,
        pass: process.env.SENDER_PASSWORD,
      },
    })

    const token = jwt.sign({ id: user._id, emailVerification: true }, process.env.JWT_SECRET_KEY, { expiresIn: "15d" })

    await transporter.sendMail({
      from: `"testt testt" <${process.env.SENDER_EMAIL}>`, // sender address
      to: email, // list of receivers
      subject: "Email verification", // Subject line

      html: `Hello, please click on this link to verify your email.
      <a href="http://localhost:3000/email_verified/${token}">Verify email</a>`, // html body
    })

    await user.save()

    delete user._doc.password

    res.send("user created, please check your email for verification link")
  } catch (error) {
    res.status(500).send(error.message)
  }
})

router.get("/verify_email/:token", async (req, res) => {
  try {
    const decryptedToken = jwt.verify(req.params.token, process.env.JWT_SECRET_KEY)

    if (!decryptedToken.emailVerification) return res.status(403).send("unauthorized action")

    const userId = decryptedToken.id
    const user = await User.findByIdAndUpdate(userId, { $set: { emailVerified: true } })
    if (!user) return res.status(404).send("user not found")

    res.send("user verified")
  } catch (error) {
    res.status(500).send(error.message)
  }
})

router.post("/forgot-password", validateBody(forgotPasswordJoi), async (req, res) => {
  try {
    const { email } = req.body
    const user = await User.findOne({ email })
    if (!user) return res.status(404).send("user not found")

    const transporter = nodemailer.createTransport({
      service: "gmail",
      port: 587,
      secure: false,
      auth: {
        user: process.env.SENDER_EMAIL,
        pass: process.env.SENDER_PASSWORD,
      },
    })

    const token = jwt.sign({ id: user._id, forgotPassword: true }, process.env.JWT_SECRET_KEY, { expiresIn: "15d" })

    await transporter.sendMail({
      from: `"testt testt" <${process.env.SENDER_EMAIL}>`, // sender address
      to: email, // list of receivers
      subject: "Reset password", // Subject line

      html: `Hello, please click on this link to reset your password.
      <a href="http://localhost:3000/reset-password/${token}">Reset password</a>`, // html body
    })

    res.send("reset password link sent")
  } catch (error) {
    res.status(500).send(error.message)
  }
})

router.post("/reset-password/:token", validateBody(resetPasswordJoi), async (req, res) => {
  try {
    const decryptedToken = jwt.verify(req.params.token, process.env.JWT_SECRET_KEY)

    if (!decryptedToken.forgotPassword) return res.status(403).send("unauthorized action")
    const userId = decryptedToken.id
    const user = await User.findById(userId)
    if (!user) return res.status(404).send("user not found")

    const { password } = req.body
    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(password, salt)

    await User.findByIdAndUpdate(userId, { $set: { password: hash } })

    res.send("password reset")
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

router.get("/users", checkAdmin, async (req, res) => {
  const users = await User.find().select("-password -__v")
  res.json(users)
})

router.delete("/users/:id", checkAdmin, checkId, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).send("user not found")

    if (user.role === "Admin") return res.status(403).send("unauthorized action")

    await User.findByIdAndRemove(req.params.id)

    await Comment.deleteMany({ owner: req.params.id })

    res.send("user is deleted")
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

    if (!user.emailVerified) return res.status(403).send("user not verified, please check your email")

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, { expiresIn: "15d" })

    res.send(token)
  } catch (error) {
    res.status(500).send(error.message)
  }
})

router.post("/login/admin", validateBody(loginJoi), async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email })
    if (!user) return res.status(404).send("user not found")
    if (user.role != "Admin") return res.status(403).send("you are not admin")

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(400).send("password incorrect")

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, { expiresIn: "15d" })

    res.send(token)
  } catch (error) {
    res.status(500).send(error.message)
  }
})

router.get("/profile", checkToken, async (req, res) => {
  const user = await User.findById(req.userId).select("-__v -password").populate("likes")
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
