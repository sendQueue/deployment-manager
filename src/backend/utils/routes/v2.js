const { comparePassword, decryptText } = require("../generation/generator");
const { getGithubRepos, getGithubRepo } = require("../network/g_helper");
const { getUserByName, getUserByUUID } = require("../sql");
const { setState, setSession } = require("../utils");

module.exports = function (app) {


    app.post("/api/v2/auth", async (req, res) => {
        const user = await getUserByName(req.body.username) || await getUserByUUID(req.body.username);
        const password = req.body.password;


        if (!user || !comparePassword(password, user.password) || req.body.save == undefined) {
            setState(res, "invalid input");
            return;
        }

        setSession(req, user, (req.body.save ? 7 : undefined));
        setState(res, "success");
    })


    app.get("/api/v2/getGithubRepos", async (req, res) => {
        const user = req.session.user;

        if (!user || user.uuid.length < 1) {
            setState(res, "invalid session");
            return;
        }

        var repos = [];
        await getGithubRepos(user, r => {
            repos = r;
        })

        res.json(repos);
    })


    app.post("/api/v2/deploy", async (req, res) => {
        const user = req.session.user;

        if (!user || user.uuid.length < 1) {
            setState(res, "invalid session");
            return;
        }

        const repo = req.body.repo, envs = req.body.envs, maxMemory = req.body.maxMemory;

        if (repo == undefined || repo.name == undefined || repo.owner.login == undefined || repo.default_branch == undefined) {
            setState(res, "invalid repo provided");
            return;
        }

        if (envs != undefined) {
            let wrongEnvs = false;

            for (var env of envs) {
                if (env[0] == undefined || env[1] == undefined) {
                    wrongEnvs = true;
                    break;
                }
            }

            if (wrongEnvs || !Array.isArray(envs)) {
                setState(res, "invalid envs provided");
                return;
            }
        }

        if(maxMemory < 128 || maxMemory > 1024){
            setState(res, "invalid max memory provided");
            return;
        }

        // get full repo for current sha/version
        var fullRepo = undefined;
        await getGithubRepo(user, repo, fR => {
            fullRepo = fR;
        })

        console.log(fullRepo)

    })

}