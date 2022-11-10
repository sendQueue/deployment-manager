const { comparePassword } = require("../generation/generator");
const { getUserByName, getUserByUUID } = require("../sql");
const { setState, setSession } = require("../utils");

module.exports = function (app) {

    app.post("/api/v2/auth", async (req, res) => {
        const user = await getUserByName(req.body.username) || await getUserByUUID(req.body.username)
        const password = req.body.password;


        if (!user || !comparePassword(password, user.password) || req.body.save == undefined) {
            setState(res, "invalid input");
            return;
        }

        setSession(req, user, (req.body.save ? 7 : undefined));
        setState(res, "success");
    })


}