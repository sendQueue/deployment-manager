const { comparePassword, decryptText, encryptText } = require("../generation/generator");
const { writeEcosystem, cloneRepository, unzipRepository, isDeployed, getDeployments, getEcosystem, getProcess, getProcessLog, processAction, getRequestLog } = require("../hardware/bridge");
const { getGithubRepos, getGithubRepo } = require("../network/g_helper");
const { getUserByName, getUserByUUID, insertAction } = require("../sql");
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

        const repo = req.body.repo, envs = req.body.envs, startScript = req.body.startScript, startArgs = req.body.startArgs, maxMemory = req.body.maxMemory, action = req.body.action;

        if (repo == undefined || repo.name == undefined || repo.owner.login == undefined || repo.default_branch == undefined) {
            setState(res, "invalid args provided, reload the page");
            return;
        }
        if (!user || user.uuid.length < 1 || user.denied.includes(repo.name)) {
            setState(res, "invalid session, reload the page");
            return;
        }


        if (action == undefined || !["deploy", "repull", "reconfigure"].includes(action)) {
            setState(res, "invalid action provided, reload the page");
            return;
        }

        switch (action) {
            case "deploy":
                if(isDeployed(repo.name)){
                    setState(res, "repo already deployed - try to repull at 'configure project' if incorrectly deployed");
                    return; 
                }
                break;
        
            default:
                if(!isDeployed(repo.name)){
                    setState(res, "repo not deployed, can not " + action);
                    return; 
                }
                break;
        }

        //  check if envs are valid and in correct format
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

        //  get full repo for current sha/version
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
                        ${env_string.includes("NODE_ENV") ? "" :  'NODE_ENV: "production",'}
                        ${env_string}
                    },
                    repo: ${JSON.stringify(repo)}
                }]
            };`   

        if(!writeEcosystem(ecosystem, repo.name)){
            setState(res, "internal error: could not create ecosystem!");
            return;
        }
        
        //  only download and unzip repo if action is deploy or repull
        if(["deploy", "repull"].includes(action)){
            if(!cloneRepository(user, repo)){
                setState(res, "internal error: could not clone repository!");
                return;
            }
    
            if(!unzipRepository(repo)){
                setState(res, "internal error: could not unzip repository!");
                return;
            }
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


    app.get("/api/v2/getRequestLog", async (req, res) => {
        const user = req.session.user;

        if (!user || user.uuid.length < 1) {
            setState(res, "invalid session, reload the page");
            return;
        }

        res.json(getRequestLog())
    })

    app.get("/api/v2/getDeploymentVersion/:deployment", async (req, res) => {
        const user = req.session.user;

        if (!user || user.uuid.length < 1) {
            setState(res, "invalid session, reload the page");
            return;
        }

        const deployments = getDeployments();

        if(!deployments.includes(req.params.deployment)){
            setState(res, "invalid deployment provided");
            return;
        }
        const ecosystem = getEcosystem(user, req.params.deployment);
        if(user.denied.includes(req.params.deployment)){
            delete ecosystem.apps[0].env
        }
        res.json(ecosystem)
    })

    app.get("/api/v2/getRepoVersion/:deployment", async (req, res) => {
        const user = req.session.user;

        if (!user || user.uuid.length < 1 || user.denied.includes(req.body.deployment)) {
            setState(res, "invalid session, reload the page");
            return;
        }

        await getGithubRepos(user, async repos => {
            var l = repos.filter(r => r.name == req.params.deployment);
            if(l.length == 0){
                res.json();
                return;
            }

            await getGithubRepo(user, l[0], result => {
                res.json(result);
            })
        })


    })


    app.get("/api/v2/getProcess/:deployment", async (req, res) => {
        const user = req.session.user;

        if (!user || user.uuid.length < 1) {
            setState(res, "invalid session, reload the page");
            return;
        }

        const deployments = getDeployments();

        if(!deployments.includes(req.params.deployment)){
            setState(res, "invalid deployment provided");
            return;
        }

        var process = getProcess(req.params.deployment), isRunning = undefined

        if (process != undefined) {
            const keepKeys = ["pm_uptime", "axm_monitor", "status", "restart_time"]

            Object.keys(process.pm2_env).forEach(env => {
                if(!keepKeys.includes(env)) delete process.pm2_env[env];
            })

            isRunning = !process.pm2_env.status.includes('stopped')
        }
        res.json({ running: isRunning, process: process })
    })


    app.get("/api/v2/getLogs/:deployment/:type/:amount", async (req, res) => {
        const user = req.session.user;

        if (!user || user.uuid.length < 1 || user.denied.includes(req.params.deployment)) {
            setState(res, "invalid session, reload the page");
            return;
        }

        const deployments = getDeployments();

        if(!deployments.includes(req.params.deployment)){
            setState(res, "invalid deployment provided");
            return;
        }

        const amount = Math.min(parseInt(req.params.amount), 1000)

        res.json(getProcessLog(req.params.deployment, req.params.type, amount));

    })


    app.post("/api/v2/processAction/:action", async (req, res) => {
        const user = req.session.user;

        if (!user || user.uuid.length < 1 || user.denied.includes(req.body.deployment)) {
            setState(res, "invalid session, reload the page");
            return;
        }

        const process_name = req.body.deployment;
        const deployments = getDeployments();
        console.log(user.denied, process_name)
        
        if(!deployments.includes(process_name)){
            setState(res, "invalid deployment provided");
            return;
        }
        
        const action = req.params.action;
        if(!["restart", "stop", "delete"].includes(action)){
            setState(res, "invalid action provided");
            return;
        }

        processAction(process_name, action);
        insertAction(req, user.uuid, action, process_name)

        res.json({});
    })
}