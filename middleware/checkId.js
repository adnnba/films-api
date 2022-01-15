const mongoose = require("mongoose")

const checkId = async (req, res, next) => {
  try {
    const id = req.params.id
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).send("the path id is not a valid object id")

    next()
  } catch (error) {
    console.log(error)
    res.status(500).send(error.message)
  }
}

module.exports = checkId
