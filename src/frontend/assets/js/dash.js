document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        document.body.classList.add("loaded");
        document.getElementById('loading-msg').innerText = "";
    }, 100);
});


window.addEventListener('popstate', () => {
    app.goBack()
});

const app = new Vue({
    el: "#app",
    data: {
        overview: 0,
        lastOverview: 0,
        title: "Overview",


        repos: [],
        deployment: 0,
        selectedRepo: {},
        tmpRepo: {},
        startScript: "",
        startArgs: "",
        maxMemory: 256,
        envs: [],
        envKey: "",
        envValue: "",

        selectedDeployment: "",
        deployments: [],
        process_state: "not_fully_deployed",
        show_state: false,
        memory_usage: -1,
        cpu_usage: -1,
        monitor: undefined,
        version: "",
        repoLink: "",

        search: "",
        message: ""

    },
    mounted: async function () {
        await this.mount();
    },
    methods: {
        async mount() {
            await fetch("/api/v2/getGithubRepos").then(async response => {
                const r = await response.json();
                if (!r["state"]) {
                    this.repos = r;
                    if (localStorage.getItem("selectedDeployment") != undefined) {
                        for (repo of this.repos) {
                            if (repo.name == localStorage.getItem("selectedDeployment")) {
                                this.selectedRepo = repo;
                            }
                        }
                    }
                }
            })

            await fetch("/api/v2/getDeployments").then(async response => {
                const r = await response.json();
                if (!r["state"]) {
                    this.deployments = r;
                    const deployment = localStorage.getItem("selectedDeployment");
                    if (deployment) {
                        this.selectedDeployment = deployment
                    } else {
                        this.selectedDeployment = r.length > 0 ? r[0] : "";
                    }
                }
            })

            if (this.selectedDeployment.length > 0) {
                this.getVersion();
                this.getProcess();
            }
            this.cycle();
            history.pushState(null, null, document.URL);

        },

        deployConfig(repo) {
            this.selectedRepo = repo;
            this.deployment = 1;
            this.title = "Please configure deployment settings"
        },

        addEnv() {
            if (this.envKey.length > 0 && this.envValue.length > 0) {
                var prevent = false
                for (var env of this.envs) {
                    if (env[0] == this.envKey) {
                        prevent = true;
                        break;
                    }
                }
                if (!prevent) {
                    this.envs.push([this.envKey, this.envValue])
                    this.envKey = this.envValue = ""
                } else {
                    alert("env '" + this.envKey + "' already exists.")
                }
            }
        },

        removeEnv(envs) {
            var tempEnvs = []
            for (var env of this.envs) {
                if (env[0] != envs[0] && env[1] != envs[1]) {
                    tempEnvs.push(env)
                }
            }

            this.envs = tempEnvs;
        },

        importEnvs() {
            const e = prompt("Please paste your environment variables (only nodemon file syntax!):")
            const parsed = JSON.parse(e.replaceAll("\n", ""))

            if (parsed.env == undefined) {
                alert("Invalid format")
                return
            }
            this.envKey = this.envValue = ""
            this.envs = []
            for (var key in parsed.env) {
                this.envs.push([key, parsed.env[key]])
            }
        },

        async deploy(action) {
            if (!this.startScript.startsWith("./") || this.selectedRepo.name == undefined || this.maxMemory > 1024 || this.maxMemory < 128) {
                this.message = "specify start script and select repo"
                return;
            }

            if (!confirm("Are you sure you want to " + action + " '" + this.selectedRepo.name + "'?")) return;

            document.body.classList.remove("loaded")
            document.getElementById('loading-msg').innerText = "deploying..";

            await fetch("/api/v2/deploy", {
                method: "POST",
                headers: {
                    'content-type': 'application/json',
                },
                body: JSON.stringify({
                    repo: this.selectedRepo,
                    startScript: this.startScript,
                    startArgs: this.startArgs,
                    maxMemory: this.maxMemory,
                    envs: this.envs,
                    action: action
                })
            }).then(async response => {
                const result = await response.json();
                if (result.state == "success") {
                    this.message = "success, redirecting to PM in 5 seconds..";
                    setTimeout(async () => {
                        await this.mount();
                        this.goBack();
                        this.goBack();
                        this.goBack();
                        this.overview = 2;
                        this.title = "Process and log monitor";
                        this.addHistory()
                        this.message = "";
                    }, 5000);
                } else {
                    this.message = result.state;
                }
                document.body.classList.add("loaded")
                document.getElementById('loading-msg').innerText = "";
            })
        },

        async restart() {
            await fetch("/api/v2/processAction/restart", {
                method: "POST",
                headers: {
                    'content-type': 'application/json',
                },
                body: JSON.stringify({
                    deployment: this.selectedRepo.name,
                })
            })
        },

        async stop() {
            await fetch("/api/v2/processAction/stop", {
                method: "POST",
                headers: {
                    'content-type': 'application/json',
                },
                body: JSON.stringify({
                    deployment: this.selectedRepo.name,
                })
            })
        },

        async deleteDeployment() {
            if (!confirm("\nAre you sure you want to delete '" + this.selectedRepo.name + "'? \n\n*not recoverable*")) return;
            await fetch("/api/v2/processAction/delete", {
                method: "POST",
                headers: {
                    'content-type': 'application/json',
                },
                body: JSON.stringify({
                    deployment: this.selectedRepo.name,
                })
            })
            localStorage.clear();
            location.reload();
        },

        getVersion() {
            if (this.selectedDeployment.length == 0) return;
            fetch("/api/v2/getDeploymentVersion/" + this.selectedDeployment).then(async response => {
                const result = await response.json();
                if (result["state"] != undefined) {
                    this.version = "no perm."
                    return;
                }
                this.tmpRepo = result.apps[0].repo
                this.version = result.apps[0].sha
                this.repoLink = result.apps[0].url + "/tree/" + this.version
                if (this.overview == 3) {
                    this.startScript = result.apps[0].script
                    this.startArgs = result.apps[0].args
                    this.maxMemory = result.apps[0].max_memory_restart.split("M")[0]
                    this.envKey = this.envValue = ""
                    this.envs = []
                    for (var key in result.apps[0].env) {
                        this.envs.push([key, result.apps[0].env[key]])
                    }
                }
            })
        },

        getProcess() {
            if (this.selectedDeployment.length == 0) return;
            fetch("/api/v2/getProcess/" + this.selectedDeployment).then(async response => {
                const result = await response.json();
                if(this.overview != 1)
                    this.selectedRepo = this.tmpRepo

                if (result["state"] != undefined) {
                } else {
                    if (result["running"] != undefined) {
                        this.process_state = result["running"] == true ? "running" : "not_running";

                        if (result["process"].monit != undefined) {
                            this.cpu_usage = result["process"].monit.cpu;
                            this.memory_usage = (Math.round((parseInt(result['process'].monit.memory) / 1000000) * 100) / 100).toFixed(2)
                        }

                        if (result.process.pm2_env != undefined) {
                            this.monitor = result.process.pm2_env;
                        }
                    } else {
                        this.process_state = "not_fully_deployed";
                    }
                }
            })
        },

        changeDeployment() {
            localStorage.setItem("selectedDeployment", this.selectedDeployment);
            this.monitor = undefined
            if (this.selectedDeployment != undefined) {
                for (repo of this.repos) {
                    if (repo.name == this.selectedDeployment) {
                        this.selectedRepo = repo;
                    }
                }
            }
            this.getProcess();
            this.getVersion();

        },


        goBack() {
            this.message = ""
            if (this.overview == 1) {
                if (this.deployment == 0) {
                    this.overview = 0;
                    this.title = "Overview";
                } else if (this.deployment == 1) {
                    this.deployment = 0;
                    this.selectedRepo = {};
                    this.title = "Click a repository to deploy"
                    this.envs = []
                    this.startScript = ""
                    this.startArgs = ""
                    this.maxMemory = 256
                    this.selectedRepo = {}
                }
            } else if (this.overview == 2) {
                this.overview = 0;
                this.title = "Overview";
            } else {
                this.overview = 0;
                this.title = "Overview";
            }
        },

        openTab(url) {
            window.open(url, '_blank').focus();
        },

        addHistory() {
            history.pushState(null, null, document.URL)
            if (this.overview == 3 || this.overview == 2) {
                this.getVersion();
                if (this.selectedDeployment != undefined) {
                    for (repo of this.repos) {
                        if (repo.name == this.selectedDeployment) {
                            this.selectedRepo = repo;
                        }
                    }
                }
            } else if (this.overview == 1) {
                this.selectedRepo = undefined
                this.startScript = this.startArgs = ""
                this.maxMemory = 256
            }
        },

        logout() {
            location.pathname = "/kill"
        },

        help() {
            window.open("https://github.com/sendQueue/deployment-manager", '_blank').focus();
        },

        resetMessage(delay) {
            setTimeout(() => {
                this.message = "";
            }, delay || 5000);
        },

        cycle() {
            setTimeout(() => {
                this.getProcess();
                this.cycle();
            }, 2000);
        }
    }
})

window.onhashchange = function () {
    app.overview = 0;
}

function isNumeric(str) {
    if (typeof str != "string") return false;

    return !isNaN(str) && !isNaN(parseFloat(str));
}
