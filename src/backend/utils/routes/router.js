const path = require("path");
const { refreshSessionInterval } = require("../../config");
const { getUserByUUID } = require("../sql");
const { setSession } = require("../utils");

module.exports = function (app) {
    
    app.get("/login", async (req, res) => {
        const user = req.session.user;

        if(user && user.uuid.length > 1){
            res.redirect("/dash");
            return;
        }

        res.sendFile(path.join(__dirname, '../../../frontend/login.html'))
    })


    app.get(["/", "/dash", "/deploy", "/pm", "/update"], async (req, res) => {
        let user = req.session.user, loc = req.originalUrl.replace("/", "");

        if(!user || user.uuid.length < 4){
            res.redirect("/login");
            return;
        }

        // refresh permissions/session after refreshSessionInterval min
        if(Date.now() - user.session_age > 1000 * 60 * refreshSessionInterval){
            user = await getUserByUUID(user.uuid);
            setSession(req, user);
        }
        
        if(user.access_token.length < 1){
            loc = "dash";
        }
        
        res.sendFile(path.join(__dirname, "../../../frontend/dash.html"));
    })
    

    app.get("/log/:deployment", async(req, res) => {
        let user = req.session.user;

        if(!user || user.uuid.length < 4){
            res.redirect("/login");
            return;
        }

        if(Date.now() - user.session_age > 1000 * 60 * refreshSessionInterval){
            user = await getUserByUUID(user.uuid);
            setSession(req, user);
        }

        res.sendFile(path.join(__dirname, "../../../frontend/log.html"));

    })


    app.get(["/kill", "/logout"], (req, res) => {
        req.session.user = undefined
        req.session.destroy(function (err) { })
        setTimeout(() => {
            res.redirect("/login")
        }, 50)
    })
}