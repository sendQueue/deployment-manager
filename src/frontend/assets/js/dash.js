document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        document.body.classList.add("loaded");
        document.getElementById('loading-msg').innerText = "";
    }, 100);
});

const app = new Vue({
    el: "#app",
    data: {
        overview: 0,
        lastOverview: 0,
        title: "Overview",


        deployment: 0,
        selectedRepo: {},
        startScript: "",
        startArgs: "",
        maxMemory: 256,
        envs: [],
        envKey: "",
        envValue: "",

        repos: [],
        search: "",
        message: ""

    },
    mounted: function () {
        fetch("/api/v2/getGithubRepos").then(async result => {
            const r = await result.json();
            if (!r["state"]) {
                this.repos = r;
            }
        })
    },
    methods: {

        deployConfig(repo) {
            this.selectedRepo = repo;
            this.deployment = 1;
            this.title = "Please configure deployment settings"
        },

        addEnv() {
            if (this.envKey.length > 0 && this.envValue.length > 0) {
                var prevent = false
                for (var env of this.envs) {
                    console.log(env)
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

        async deploy() {
            if (!this.startScript.startsWith("./") || this.selectedRepo.name == undefined || this.maxMemory > 1024 || this.maxMemory < 128) {
                this.message = "specify start script and select repo"
                return;
            }

            if(!confirm("Are you sure you want to deploy '" + this.selectedRepo.name + "'?")) return;

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
                    envs: this.envs
                })
            }).then(async response => {
                const result = await response.json();
                if (result.state == "success") {
                    this.message = "success, redirecting to PM in 10 seconds..";
                    setTimeout(() => {
                        this.goBack();
                        this.goBack();
                        this.overview = 2;
                        this.title = "Process and log monitor"
                    }, 10000);
                } else {
                    this.message = result.state;
                }
                console.log(result)
                document.body.classList.add("loaded")
                document.getElementById('loading-msg').innerText = "";
            })
        },

        goBack() {
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
            window.history.pushState(undefined, window.location.href)
        },

        help() {
            window.open("https://github.com/sendQueue/deployment-manager", '_blank').focus();
        },

        resetMessage(delay) {
            setTimeout(() => {
                this.message = "";
            }, delay || 5000);
        }
    }
})

window.onhashchange = function () {
    app.overview = 0;
    alert("he")
}

function isNumeric(str) {
    if (typeof str != "string") return false;

    return !isNaN(str) && !isNaN(parseFloat(str));
}
