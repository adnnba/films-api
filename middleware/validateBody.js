const validateBody = elementJoi => {
  return async (req, res, next) => {
    try {
      const result = elementJoi.validate(req.body)
      if (result.error) return res.status(400).send(result.error.details[0].message)

      next()
    } catch (error) {
      console.log(error)
      res.status(500).send(error.message)
    }
  }
}

module.exports = validateBody
