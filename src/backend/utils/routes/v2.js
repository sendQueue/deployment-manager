const { comparePassword, decryptText } = require("../generation/generator");
const { writeEcosystem, cloneRepository, unzipRepository, isDeployed, getDeployments } = require("../hardware/bridge");
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
            setState(res, "invalid session, reload the page");
            return;
        }

        const repo = req.body.repo, envs = req.body.envs, startScript = req.body.startScript, startArgs = req.body.startArgs, maxMemory = req.body.maxMemory;

        if (repo == undefined || repo.name == undefined || repo.owner.login == undefined || repo.default_branch == undefined) {
            setState(res, "invalid repo provided, reload the page");
            return;
        }

        if(isDeployed(repo.name)){
            setState(res, "repo already deployed - try to repull at 'configure project' if incorrectly deployed");
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
                setState(res, "invalid envs provided, reload the page");
                return;
            }
        }

        if (startScript == undefined || !startScript.startsWith("./")) {
            setState(res, "invalid start script path provided, reload the page");
            return;
        }

        if (maxMemory < 128 || maxMemory > 1024) {
            setState(res, "invalid max memory provided, reload the page");
            return;
        }

        // get full repo for current sha/version
        var fullRepo = undefined;
        await getGithubRepo(user, repo, fR => {
            fullRepo = fR;
        })


        if (fullRepo == undefined) {
            setState(res, "invalid access to repo or repo not found, reload the page");
            return;
        }

        let env_string = ""
        envs.forEach(env => env_string += `${env[0]}: "${env[1]}", \n                        `)

        const ecosystem =
            `module.exports = {
                apps: [{
                    name: "${repo.name}",
                    script: "${startScript}",
                    args: "${startArgs == undefined ? "" : startArgs}",
                    sha: "${fullRepo.object.sha}",
                    url: "${repo.html_url}",
                    log: "process.log", 
                    time: true,
                    instances: "1",
                    exec_mode: "fork",
                    autorestart: true,
                    restart_delay: 50, 
                    watch: false,
                    max_memory_restart: "${maxMemory}M",
                    env: {
                        ${env_string}
                    }
                }]
            };`

        if(!writeEcosystem(ecosystem, repo.name)){
            setState(res, "internal error: could not create ecosystem!");
            return;
        }
        
        if(!cloneRepository(user, repo)){
            setState(res, "internal error: could not clone repository!");
            return;
        }

        if(!unzipRepository(repo)){
            setState(res, "internal error: could not unzip repository!");
            return;
        }

        setState(res, "success");

    })


    app.get("/api/v2/getDeployments", async (req, res) => {
        const user = req.session.user;

        if (!user || user.uuid.length < 1) {
            setState(res, "invalid session, reload the page");
            return;
        }

        res.json(getDeployments());
    })
}