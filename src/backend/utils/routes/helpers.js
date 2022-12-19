const { hashPassword, encryptText, decryptText } = require("../generation/generator")
const { setState } = require("../utils")


module.exports = function (app) {
    
    app.get("/hash/:toHash/" + process.env.SESSION_KEY, async (req, res) => {
        setState(res, hashPassword(req.params.toHash));
    })

    app.get("/encryptText/:text/" + process.env.SESSION_KEY, async (req, res) => {
        setState(res, encryptText(req.params.text));
    })

    app.get("/decryptText/:text/" + process.env.SESSION_KEY, async (req, res) => {
        setState(res, decryptText(req.params.text));
    })
}