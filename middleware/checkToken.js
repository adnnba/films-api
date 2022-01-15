const jwt = require("jsonwebtoken")
const { User } = require("../models/User")

const checkToken = async (req, res, next) => {
  try {
    const token = req.header("Authorization")
    if (!token) return res.status(401).send("token is missing")

    const decryptedToken = jwt.verify(token, process.env.JWT_SECRET_KEY)
    const userId = decryptedToken.id

    const user = await User.findById(userId)
    if (!user) return res.status(404).send("user not found")

    req.userId = userId

    next()
  } catch (error) {
    console.log(error)
    res.status(500).send(error.message)
  }
}

module.exports = checkToken
