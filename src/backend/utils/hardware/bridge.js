const { execSync } = require('child_process');
const { deploymentPath, nginxAccessLog } = require('../../config');
const { isValid, insertCache } = require('../cache');
const { decryptText } = require('../generation/generator');
const { requireFromString } = require('../utils');

const fs = require('fs'), fsp = require('fs').promises;

module.exports = {


    isDeployed(name) {
        if (process.env.NODE_ENV == "development") return false;

        try {
            return fs.existsSync(deploymentPath + name) && fs.existsSync(deploymentPath + name + "/deployment_ecosystem.config.js") && !name.startsWith("DELETED_#")
        } catch (error) {
            return false;
        }
    },


    writeEcosystem(ecosystem, name, override) {
        if (process.env.NODE_ENV == "development") return true;

        try {
            if (fs.existsSync(deploymentPath) || override) {
                if (fs.existsSync(deploymentPath + name)) {

                    fs.writeFileSync(deploymentPath + name + "/deployment_ecosystem.config.js", ecosystem);
                    return fs.existsSync(deploymentPath + name + "/deployment_ecosystem.config.js");
                } else {
                    fs.mkdirSync(deploymentPath + name);
                    return module.exports.writeEcosystem(ecosystem, name);
                }
            }
        } catch (error) {
            return false;
        }
    },

    getEcosystem(user, name) {
        if (process.env.NODE_ENV == "development") return {
            apps: [{
                name: "tiny.rip",
                script: "./src/backend/server.js",
                args: "",
                sha: "abf742272e3db773d02f5d9912958fea6d8afd53",
                url: "https://github.com/sendQueue/tiny.rip",
                log: "process.log",
                time: true,
                instances: "1",
                exec_mode: "fork",
                autorestart: true,
                restart_delay: 50,
                watch: false,
                max_memory_restart: "256M",
                env: {
                    SQL_HOST: "130.61.223.110",
                    SQL_PORT: "3306",
                    SQL_USER: "admin",
                    SQL_DB: "v3",
                }
            }]
        }
        const location = deploymentPath + name + "/deployment_ecosystem.config.js";
        try {
            if (fs.existsSync(location)) {
                const data = fs.readFileSync(location, "utf8");
                const parsed = requireFromString(data, "");
                return parsed;
            }
        } catch (error) {
            return false;
        }
    },


    cloneRepository(user, repo, override) {
        if (process.env.NODE_ENV == "development") return true;

        try {
            if (fs.existsSync(deploymentPath + repo.name) || override) {
                const masterLink = `https://github.com/${repo.owner.login}/${repo.name}/archive/refs/heads/master.zip`

                execSync(`curl -H "Authorization: token ${decryptText(user.access_token)}" -L ${masterLink} --output ${deploymentPath}/${repo.name}/${repo.name}-repository.zip`);

                return fs.existsSync(deploymentPath + repo.name + `/${repo.name}-repository.zip`);
            } else {
                return false;
            }
        } catch (error) {
            return false;
        }
    },


    unzipRepository(repo) {
        if (process.env.NODE_ENV == "development") return true;

        try {
            if (fs.existsSync(deploymentPath + repo.name + `/${repo.name}-repository.zip`)) {

                execSync(`extract-zip ${deploymentPath}${repo.name}/${repo.name}-repository.zip ${deploymentPath}${repo.name}`).toString();

                var extractedPath = `${deploymentPath}${repo.name}/${repo.name}-${repo.default_branch}`;

                execSync(`yes | cp -rf /${extractedPath}/* ${deploymentPath}${repo.name}/`);

                execSync(`cd ${deploymentPath}${repo.name}/ && npm install`);

                execSync(`rm -r ${deploymentPath}${repo.name}/${repo.name}-${repo.default_branch}`)
                return fs.existsSync(deploymentPath + repo.name + `/package.json`);
            } else {
                return false;
            }
        } catch (error) {
            return false;
        }
    },


    getDeployments() {
        if (process.env.NODE_ENV == "development") return ["deployment-manager", "tiny.rip", "pw-manager"];

        try {
            if (fs.existsSync(deploymentPath)) {
                return fs.readdirSync(deploymentPath)
                    .filter(entry => fs.statSync(deploymentPath + entry).isDirectory())
                    .filter(entry => module.exports.isDeployed(entry));
            } else {
                return [];
            }
        } catch (error) {
            return [];
        }
    },


    getProcess(process_name) {
        if (process.env.NODE_ENV == "development") return {
            "pid": 1876579,
            "name": "tinybot",
            "pm2_env": {
                "script": "./index.js",
                "log_file": "process.log",
                "prev_restart_delay": 0,
                "exit_code": 0,
                "node_version": "17.9.0",
                "versioning": null,
                "version": "2.0.0",
                "unstable_restarts": 0,
                "restart_time": 1,
                "pm_id": 3,
                "created_at": 1660499186616,
                "axm_dynamic": {},
                "axm_options": {
                    "error": true,
                    "heapdump": true,
                    "feature.profiler.heapsnapshot": false,
                    "feature.profiler.heapsampling": true,
                    "feature.profiler.cpu_js": true,
                    "latency": true,
                    "catchExceptions": true,
                    "profiling": true,
                    "metrics": {
                        "http": true,
                        "runtime": true,
                        "eventLoop": true,
                        "network": false,
                        "v8": true
                    },
                    "standalone": false,
                    "tracing": {
                        "outbound": false,
                        "enabled": false
                    },
                    "module_conf": {},
                    "apm": {
                        "version": "5.0.0",
                        "type": "node"
                    },
                    "module_name": "tinybot",
                    "module_version": "5.1.2"
                },
                "axm_monitor": {
                    "Heap Size": {
                        "value": "32.19",
                        "type": "internal/v8/heap/total",
                        "unit": "MiB",
                        "historic": true
                    },
                    "Heap Usage": {
                        "value": 68.25,
                        "type": "internal/v8/heap/usage",
                        "unit": "%",
                        "historic": true
                    },
                    "Used Heap Size": {
                        "value": "21.97",
                        "type": "internal/v8/heap/used",
                        "unit": "MiB",
                        "historic": true
                    },
                    "Active requests": {
                        "value": 0,
                        "type": "internal/libuv/requests",
                        "historic": true
                    },
                    "Active handles": {
                        "value": 5,
                        "type": "internal/libuv/handles",
                        "historic": true
                    },
                    "Event Loop Latency": {
                        "value": "0.33",
                        "type": "internal/libuv/latency/p50",
                        "unit": "ms",
                        "historic": true
                    },
                    "Event Loop Latency p95": {
                        "value": "1.11",
                        "type": "internal/libuv/latency/p95",
                        "unit": "ms",
                        "historic": true
                    }
                },
                "axm_actions": [
                    {
                        "action_name": "km:heapdump",
                        "action_type": "internal",
                        "arity": 2
                    },
                    {
                        "action_name": "km:cpu:profiling:start",
                        "action_type": "internal",
                        "arity": 2
                    },
                    {
                        "action_name": "km:cpu:profiling:stop",
                        "action_type": "internal",
                        "arity": 1
                    },
                    {
                        "action_name": "km:heap:sampling:start",
                        "action_type": "internal",
                        "arity": 2
                    },
                    {
                        "action_name": "km:heap:sampling:stop",
                        "action_type": "internal",
                        "arity": 1
                    }
                ],
                "pm_uptime": 1660499186616,
                "status": "online",
                "tinybot": "{}",
                "SQL_PORT": "3306",
                "NODE_ENV": "production",
                "SSH_CONNECTION": "111.11.11.229 63493 10.0.0.17 22",
                "XDG_DATA_DIRS": "/usr/local/share:/usr/share:/var/lib/snapd/desktop",
                "PWD": "/home/ubuntu/main/deployments/tinybot",
                "SQL_USER": "admin",
                "SQL_HOST": "11.11.223.110",
                "deploy": "{}",
                "LESSCLOSE": "/usr/bin/lesspipe %s %s",
                "unique_id": "aad44214-cb03-417d-8c62-b024c51747a2",
                "SECRET": "K7IG-RLQL-EJ2X-G7BA-24GH-AQ2T-U6DL-PTYG-OL5K-KIDH-DSBW-657G-SURA-UNVH-7QIZ-9WAG-R2LU-AZIZ-T323-MZL4-C5UE-F1BY-IYFP-AIKQ-2AZL-9W6U-MTB5-7YXM-H7AM-8B2F-NU63-ZO35-5Q3M-C2E4-UOPA-17GY-JXX5-86SI-21UE-FQ3C-QZJU-F51W-YO5Y-SLVS-IJZQ-XYAX-DTBK-CVT3-Y37D-PZ16-SLQ4",
                "SHELL": "/bin/bash",
                "PM2_JSON_PROCESSING": "true",
                "LS_COLORS": "rs=0:di=01;34:ln=01;36:mh=00:pi=40;33:so=01;35:do=01;35:bd=40;33;01:cd=40;33;01:or=40;31;01:mi=00:su=37;41:sg=30;43:ca=30;41:tw=30;42:ow=34;42:st=37;44:ex=01;32:*.tar=01;31:*.tgz=01;31:*.arc=01;31:*.arj=01;31:*.taz=01;31:*.lha=01;31:*.lz4=01;31:*.lzh=01;31:*.lzma=01;31:*.tlz=01;31:*.txz=01;31:*.tzo=01;31:*.t7z=01;31:*.zip=01;31:*.z=01;31:*.dz=01;31:*.gz=01;31:*.lrz=01;31:*.lz=01;31:*.lzo=01;31:*.xz=01;31:*.zst=01;31:*.tzst=01;31:*.bz2=01;31:*.bz=01;31:*.tbz=01;31:*.tbz2=01;31:*.tz=01;31:*.deb=01;31:*.rpm=01;31:*.jar=01;31:*.war=01;31:*.ear=01;31:*.sar=01;31:*.rar=01;31:*.alz=01;31:*.ace=01;31:*.zoo=01;31:*.cpio=01;31:*.7z=01;31:*.rz=01;31:*.cab=01;31:*.wim=01;31:*.swm=01;31:*.dwm=01;31:*.esd=01;31:*.jpg=01;35:*.jpeg=01;35:*.mjpg=01;35:*.mjpeg=01;35:*.gif=01;35:*.bmp=01;35:*.pbm=01;35:*.pgm=01;35:*.ppm=01;35:*.tga=01;35:*.xbm=01;35:*.xpm=01;35:*.tif=01;35:*.tiff=01;35:*.png=01;35:*.svg=01;35:*.svgz=01;35:*.mng=01;35:*.pcx=01;35:*.mov=01;35:*.mpg=01;35:*.mpeg=01;35:*.m2v=01;35:*.mkv=01;35:*.webm=01;35:*.ogm=01;35:*.mp4=01;35:*.m4v=01;35:*.mp4v=01;35:*.vob=01;35:*.qt=01;35:*.nuv=01;35:*.wmv=01;35:*.asf=01;35:*.rm=01;35:*.rmvb=01;35:*.flc=01;35:*.avi=01;35:*.fli=01;35:*.flv=01;35:*.gl=01;35:*.dl=01;35:*.xcf=01;35:*.xwd=01;35:*.yuv=01;35:*.cgm=01;35:*.emf=01;35:*.ogv=01;35:*.ogx=01;35:*.aac=00;36:*.au=00;36:*.flac=00;36:*.m4a=00;36:*.mid=00;36:*.midi=00;36:*.mka=00;36:*.mp3=00;36:*.mpc=00;36:*.ogg=00;36:*.ra=00;36:*.wav=00;36:*.oga=00;36:*.opus=00;36:*.spx=00;36:*.xspf=00;36:",
                "SQL_PASS": "8c509ddba3da77b62e4263a35eb28667e7dff1614c9a6dd1",
                "LANG": "C.UTF-8",
                "XDG_RUNTIME_DIR": "/run/user/1001",
                "PATH": "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games:/snap/bin",
                "SESSION_KEY": "YV6L-RRF3-ZFHB-9IYF-37SE-W7NR-1VEM",
                "TERM": "xterm",
                "XDG_SESSION_ID": "1",
                "XDG_SESSION_CLASS": "user",
                "_": "/usr/bin/pm2",
                "LOGNAME": "ubuntu",
                "SQL_DB2": "deploy",
                "DBUS_SESSION_BUS_ADDRESS": "unix:path=/run/user/1001/bus",
                "PM2_HOME": "/home/ubuntu/.pm2",
                "SSH_TTY": "/dev/pts/0",
                "MOTD_SHOWN": "pam",
                "HOME": "/home/ubuntu",
                "OLDPWD": "/home/ubuntu/main/node_projects/deploy",
                "SHLVL": "1",
                "PM2_USAGE": "CLI",
                "XDG_SESSION_TYPE": "tty",
                "SQL_DB": "u143900148_tiny",
                "USER": "ubuntu",
                "SSH_CLIENT": "111.11.111.229 63493 22",
                "LESSOPEN": "| /usr/bin/lesspipe %s",
                "NODE_APP_INSTANCE": "1",
                "vizion_running": false,
                "km_link": "false",
                "pm_pid_path": "/home/ubuntu/.pm2/pids/tinybot-3.pid",
                "pm_err_log_path": "/home/ubuntu/.pm2/logs/tinybot-error-3.log",
                "pm_out_log_path": "/home/ubuntu/.pm2/logs/tinybot-out-3.log",
                "pm_log_path": "/home/ubuntu/main/node_projects/deploy/process-3.log",
                "exec_interpreter": "node",
                "pm_cwd": "/home/ubuntu/main/deployments/tinybot",
                "pm_exec_path": "/home/ubuntu/main/deployments/tinybot/index.js",
                "node_args": [],
                "name": "tinybot",
                "args": [],
                "log_date_format": "YYYY-MM-DDTHH:mm:ss",
                "time": true,
                "env": {
                    "NODE_ENV": "production"
                },
                "max_memory_restart": 268435456,
                "restart_delay": 50,
                "instances": 1,
                "vizion": true,
                "autorestart": true,
                "watch": false,
                "exec_mode": "fork_mode",
                "instance_var": "NODE_APP_INSTANCE",
                "pmx": true,
                "automation": true,
                "treekill": true,
                "username": "ubuntu",
                "windowsHide": true,
                "kill_retry_time": 100,
                "namespace": "default"
            },
            "pm_id": 3,
            "monit": {
                "memory": 91594752,
                "cpu": 0.1
            }
        };
        try {
            const jlist = JSON.parse(execSync("pm2 jlist"));
            var processObject = undefined
            jlist.forEach(process => {
                if (process.name == process_name) {
                    processObject = process
                }
            })

            return processObject
        } catch (error) {
            return undefined;
        }
    },

    getProcessLog(process_name, type, amount) {
        if (process.env.NODE_ENV == "development") return { log: "2023-01-16T16:01:11:       at Promise._settlePromise (/home/ubuntu/main/deployments/tiny.rip/node_modules/bluebird/js/release/promise.js:604:18)\n2023-01-16T16:01:11:       at Promise._settlePromise0 (/home/ubuntu/main/deployments/tiny.rip/node_modules/bluebird/js/release/promise.js:649:10)\n2023-01-16T16:01:11:       at Promise._settlePromises (/home/ubuntu/main/deployments/tiny.rip/node_modules/bluebird/js/release/promise.js:729:18)\n2023-01-16T16:01:11:       at _drainQueueStep (/home/ubuntu/main/deployments/tiny.rip/node_modules/bluebird/js/release/async.js:93:12)\n2023-01-16T16:01:11:       at _drainQueue (/home/ubuntu/main/deployments/tiny.rip/node_modules/bluebird/js/release/async.js:86:9)\n2023-01-16T16:01:11:       at Async._drainQueues (/home/ubuntu/main/deployments/tiny.rip/node_modules/bluebird/js/release/async.js:102:5)\n2023-01-16T16:01:11:       at Immediate.Async.drainQueues (/home/ubuntu/main/deployments/tiny.rip/node_modules/bluebird/js/release/async.js:15:14)\n2023-01-16T16:01:11:       at processImmediate (node:internal/timers:466:21),\n2023-01-16T16:01:11:   options: {\n2023-01-16T16:01:11:     method: 'POST',\n2023-01-16T16:01:11:     url: '\\n' +\n2023-01-16T16:01:11:       '- Anzahl der Bots pro Game -1 Milestone\\n' +\n2023-01-16T16:01:11:       '- Spezialisierung: Nahkampf,Fernkampf, automatisch -3 Milestone\\n' +\n2023-01-16T16:01:11:       '- Rollen: Automatisch, Bett beschützen, Farmen + Diamanten/Smaragde, Angriff, Brückenabwehr, Bridgen, Betten zerstören, Bodyguard. -3 Milestone\\n' +\n2023-01-16T16:01:11:       '- Team auswahl/Anzahl -1 Milestone\\n' +\n2023-01-16T16:01:11:       '- Jump Hits häufigkeit -1 Milestone\\n' +\n2023-01-16T16:01:11:       '//- Api für Bot Kaufen (WEIL WIR GUI MACHEN)\\n' +\n2023-01-16T16:01:11:       '- finale Tests und Code Cleanup -1 Milestone für 10$\\n' +\n2023-01-16T16:01:11:       '\\n' +\n2023-01-16T16:01:11:       '- Src für 5$/i/',\n2023-01-16T16:01:11:     timeout: 1000,\n2023-01-16T16:01:11:     port: 443,\n2023-01-16T16:01:11:     headers: { 'Content-Type': 'multipart/form-data' },\n2023-01-16T16:01:11:     formData: { auth: 'PGPC-AYLR-WIOD-36PQ-XN3M-FK1Z-11PK', toDelete: undefined },\n2023-01-16T16:01:11:     callback: [Function: RP$callback],\n2023-01-16T16:01:11:     transform: undefined,\n2023-01-16T16:01:11:     simple: true,\n2023-01-16T16:01:11:     resolveWithFullResponse: false,\n2023-01-16T16:01:11:     transform2xxOnly: false\n2023-01-16T16:01:11:   },\n2023-01-16T16:01:11:   response: undefined\n2023-01-16T16:01:11: }\n2023-01-16T16:02:12: RequestError: Error: Invalid URI \"-%20Anzahl%20der%20Bots%20pro%20Game%20-1%20Milestone%0A-%20Spezialisierung:%20Nahkampf,Fernkampf,%20automatisch%20-3%20Milestone%0A-%20Rollen:%20Automatisch,%20Bett%20beschützen,%20Farmen%20+%20Diamanten/Smaragde,%20Angriff,%20Brückenabwehr,%20Bridgen,%20Betten%20zerstören,%20Bodyguard.%20-3%20Milestone%0A-%20Team%20auswahl/Anzahl%20-1%20Milestone%0A-%20Jump%20Hits%20häufigkeit%20-1%20Milestone%0A//-%20Api%20für%20Bot%20Kaufen%20(WEIL%20WIR%20GUI%20MACHEN)%0A-%20finale%20Tests%20und%20Code%20Cleanup%20-1%20Milestone%20für%2010$%0A%0A-%20Src%20für%205$/i/\"\n2023-01-16T16:02:12:     at new RequestError (/home/ubuntu/main/deployments/tiny.rip/node_modules/request-promise-core/lib/errors.js:14:15)\n2023-01-16T16:02:12:     at Request.plumbing.callback (/home/ubuntu/main/deployments/tiny.rip/node_modules/request-promise-core/lib/plumbing.js:87:29)\n2023-01-16T16:02:12:     at Request.RP$callback [as _callback] (/home/ubuntu/main/deployments/tiny.rip/node_modules/request-promise-core/lib/plumbing.js:46:31)\n2023-01-16T16:02:12:     at self.callback (/home/ubuntu/main/deployments/tiny.rip/node_modules/request/request.js:185:22)\n2023-01-16T16:02:12:     at Request.emit (node:events:527:28)\n2023-01-16T16:02:12:     at Request.init (/home/ubuntu/main/deployments/tiny.rip/node_modules/request/request.js:273:17)\n2023-01-16T16:02:12:     at Request.RP$initInterceptor [as init] (/home/ubuntu/main/deployments/tiny.rip/node_modules/request-promise-core/configure/request2.js:45:29)\n2023-01-16T16:02:12:     ... 10 lines matching cause stack trace ...\n2023-01-16T16:02:12:     at Async._drainQueues (/home/ubuntu/main/deployments/tiny.rip/node_modules/bluebird/js/release/async.js:102:5)\n2023-01-16T16:02:12:     at Immediate.Async.drainQueues [as _onImmediate] (/home/ubuntu/main/deployments/tiny.rip/node_modules/bluebird/js/release/async.js:15:14)\n2023-01-16T16:02:12:     at processImmediate (node:internal/timers:466:21) {\n2023-01-16T16:02:12:   cause: Error: Invalid URI \"-%20Anzahl%20der%20Bots%20pro%20Game%20-1%20Milestone%0A-%20Spezialisierung:%20Nahkampf,Fernkampf,%20automatisch%20-3%20Milestone%0A-%20Rollen:%20Automatisch,%20Bett%20beschützen,%20Farmen%20+%20Diamanten/Smaragde,%20Angriff,%20Brückenabwehr,%20Bridgen,%20Betten%20zerstören,%20Bodyguard.%20-3%20Milestone%0A-%20Team%20auswahl/Anzahl%20-1%20Milestone%0A-%20Jump%20Hits%20häufigkeit%20-1%20Milestone%0A//-%20Api%20für%20Bot%20Kaufen%20(WEIL%20WIR%20GUI%20MACHEN)%0A-%20finale%20Tests%20und%20Code%20Cleanup%20-1%20Milestone%20für%2010$%0A%0A-%20Src%20für%205$/i/\"\n2023-01-16T16:02:12:       at Request.init (/home/ubuntu/main/deployments/tiny.rip/node_modules/request/request.js:273:31)\n2023-01-16T16:02:12:       at Request.RP$initInterceptor [as init] (/home/ubuntu/main/deployments/tiny.rip/node_modules/request-promise-core/configure/request2.js:45:29)\n2023-01-16T16:02:12:       at new Request (/home/ubuntu/main/deployments/tiny.rip/node_modules/request/request.js:127:8)\n2023-01-16T16:02:12:       at request (/home/ubuntu/main/deployments/tiny.rip/node_modules/request/index.js:53:10)\n2023-01-16T16:02:12:       at /home/ubuntu/main/deployments/tiny.rip/src/server/utils/sql/home_sql.js:62:31\n2023-01-16T16:02:12:       at tryCatcher (/home/ubuntu/main/deployments/tiny.rip/node_modules/bluebird/js/release/util.js:16:23)\n2023-01-16T16:02:12:       at Promise._settlePromiseFromHandler (/home/ubuntu/main/deployments/tiny.rip/node_modules/bluebird/js/release/promise.js:547:31)\n2023-01-16T16:02:12:       at Promise._settlePromise (/home/ubuntu/main/deployments/tiny.rip/node_modules/bluebird/js/release/promise.js:604:18)\n2023-01-16T16:02:12:       at Promise._settlePromise0 (/home/ubuntu/main/deployments/tiny.rip/node_modules/bluebird/js/release/promise.js:649:10)\n2023-01-16T16:02:12:       at Promise._settlePromises (/home/ubuntu/main/deployments/tiny.rip/node_modules/bluebird/js/release/promise.js:729:18)\n2023-01-16T16:02:12:       at _drainQueueStep (/home/ubuntu/main/deployments/tiny.rip/node_modules/bluebird/js/release/async.js:93:12)\n2023-01-16T16:02:12:       at _drainQueue (/home/ubuntu/main/deployments/tiny.rip/node_modules/bluebird/js/release/async.js:86:9)\n2023-01-16T16:02:12:       at Async._drainQueues (/home/ubuntu/main/deployments/tiny.rip/node_modules/bluebird/js/release/async.js:102:5)\n2023-01-16T16:02:12:       at Immediate.Async.drainQueues (/home/ubuntu/main/deployments/tiny.rip/node_modules/bluebird/js/release/async.js:15:14)\n2023-01-16T16:02:12:       at processImmediate (node:internal/timers:466:21),\n2023-01-16T16:02:12:   error: Error: Invalid URI \"-%20Anzahl%20der%20Bots%20pro%20Game%20-1%20Milestone%0A-%20Spezialisierung:%20Nahkampf,Fernkampf,%20automatisch%20-3%20Milestone%0A-%20Rollen:%20Automatisch,%20Bett%20beschützen,%20Farmen%20+%20Diamanten/Smaragde,%20Angriff,%20Brückenabwehr,%20Bridgen,%20Betten%20zerstören,%20Bodyguard.%20-3%20Milestone%0A-%20Team%20auswahl/Anzahl%20-1%20Milestone%0A-%20Jump%20Hits%20häufigkeit%20-1%20Milestone%0A//-%20Api%20für%20Bot%20Kaufen%20(WEIL%20WIR%20GUI%20MACHEN)%0A-%20finale%20Tests%20und%20Code%20Cleanup%20-1%20Milestone%20für%2010$%0A%0A-%20Src%20für%205$/i/\"\n2023-01-16T16:02:12:       at Request.init (/home/ubuntu/main/deployments/tiny.rip/node_modules/request/request.js:273:31)\n2023-01-16T16:02:12:       at Request.RP$initInterceptor [as init] (/home/ubuntu/main/deployments/tiny.rip/node_modules/request-promise-core/configure/request2.js:45:29)\n2023-01-16T16:02:12:       at new Request (/home/ubuntu/main/deployments/tiny.rip/node_modules/request/request.js:127:8)\n2023-01-16T16:02:12:       at request (/home/ubuntu/main/deployments/tiny.rip/node_modules/request/index.js:53:10)\n2023-01-16T16:02:12:       at /home/ubuntu/main/deployments/tiny.rip/src/server/utils/sql/home_sql.js:62:31\n2023-01-16T16:02:12:       at tryCatcher (/home/ubuntu/main/deployments/tiny.rip/node_modules/bluebird/js/release/util.js:16:23)\n2023-01-16T16:02:12:       at Promise._settlePromiseFromHandler (/home/ubuntu/main/deployments/tiny.rip/node_modules/bluebird/js/release/promise.js:547:31)\n2023-01-16T16:02:12:       at Promise._settlePromise (/home/ubuntu/main/deployments/tiny.rip/node_modules/bluebird/js/release/promise.js:604:18)\n2023-01-16T16:02:12:       at Promise._settlePromise0 (/home/ubuntu/main/deployments/tiny.rip/node_modules/bluebird/js/release/promise.js:649:10)\n2023-01-16T16:02:12:       at Promise._settlePromises (/home/ubuntu/main/deployments/tiny.rip/node_modules/bluebird/js/release/promise.js:729:18)\n2023-01-16T16:02:12:       at _drainQueueStep (/home/ubuntu/main/deployments/tiny.rip/node_modules/bluebird/js/release/async.js:93:12)\n2023-01-16T16:02:12:       at _drainQueue (/home/ubuntu/main/deployments/tiny.rip/node_modules/bluebird/js/release/async.js:86:9)\n2023-01-16T16:02:12:       at Async._drainQueues (/home/ubuntu/main/deployments/tiny.rip/node_modules/bluebird/js/release/async.js:102:5)\n2023-01-16T16:02:12:       at Immediate.Async.drainQueues (/home/ubuntu/main/deployments/tiny.rip/node_modules/bluebird/js/release/async.js:15:14)\n2023-01-16T16:02:12:       at processImmediate (node:internal/timers:466:21),\n2023-01-16T16:02:12:   options: {\n2023-01-16T16:02:12:     method: 'POST',\n2023-01-16T16:02:12:     url: '\\n' +\n2023-01-16T16:02:12:       '- Anzahl der Bots pro Game -1 Milestone\\n' +\n2023-01-16T16:02:12:       '- Spezialisierung: Nahkampf,Fernkampf, automatisch -3 Milestone\\n' +\n2023-01-16T16:02:12:       '- Rollen: Automatisch, Bett beschützen, Farmen + Diamanten/Smaragde, Angriff, Brückenabwehr, Bridgen, Betten zerstören, Bodyguard. -3 Milestone\\n' +\n2023-01-16T16:02:12:       '- Team auswahl/Anzahl -1 Milestone\\n' +\n2023-01-16T16:02:12:       '- Jump Hits häufigkeit -1 Milestone\\n' +\n2023-01-16T16:02:12:       '//- Api für Bot Kaufen (WEIL WIR GUI MACHEN)\\n' +\n2023-01-16T16:02:12:       '- finale Tests und Code Cleanup -1 Milestone für 10$\\n' +\n2023-01-16T16:02:12:       '\\n' +\n2023-01-16T16:02:12:       '- Src für 5$/i/',\n2023-01-16T16:02:12:     timeout: 1000,\n2023-01-16T16:02:12:     port: 443,\n2023-01-16T16:02:12:     headers: { 'Content-Type': 'multipart/form-data' },\n2023-01-16T16:02:12:     formData: { auth: 'PGPC-AYLR-WIOD-36PQ-XN3M-FK1Z-11PK', toDelete: undefined },\n2023-01-16T16:02:12:     callback: [Function: RP$callback],\n2023-01-16T16:02:12:     transform: undefined,\n2023-01-16T16:02:12:     simple: true,\n2023-01-16T16:02:12:     resolveWithFullResponse: false,\n2023-01-16T16:02:12:     transform2xxOnly: false\n2023-01-16T16:02:12:   },\n2023-01-16T16:02:12:   response: undefined\n2023-01-16T16:02:12: }\n" }
        const deployment = module.exports.getProcess(process_name)
        if (deployment != undefined) {
            try {
                console.log(deployment.pm2_env.pm_log_path)
                var lines = execSync(`tail -n ${amount} ${type == "process" ? deployment.pm2_env.pm_log_path : deployment.pm2_env.pm_err_log_path}`).toString()
                return {
                    log: lines
                }
            } catch (error) { }
        }
        return {
            log: "process not found"
        }
    },

    processAction(process_name, action) {
        if (module.exports.isDeployed(process_name)) {
            if(action == "delete"){
                execSync("pm2 delete " + process_name + " | true")
                execSync("cd " + deploymentPath + " && rm -r DELETED_#" + process_name + " | true")
                execSync("cd " + deploymentPath + " && mv -f " + process_name + " DELETED_#" + process_name)
            }else{
                execSync("cd " + deploymentPath + process_name + " && pm2 " + action + " " + deploymentPath + process_name + "/deployment_ecosystem.config.js")
            }
        }
    },

    getRequestLog(){
        if(process.env.NODE_ENV == "development"){
            return {
                "tiny.rip": 300,
                "d2.vinii.de": 10
            }
        }

        
        const cache = isValid("nginx_request_log", "1", 120);

        if (cache !== false) {
            return cache;
        }

        var logPath = nginxAccessLog;
        var lines = fs.readFileSync(logPath).toString().split("\n")
        var result = {}

        lines.forEach(line => {
            var target = line.split(" ")[0];
            var isTiny = ['go0gle.gay', 'hitmen.shop', 'i-scam.online', 'profi-coder.club', 'skid-is.fun', 'tiny.rip', "dev.tiny.rip", "v2.tiny.rip", "oder.gay"].includes(target);

            if(target.length > 2){
                if(result[target] == undefined){
                    if(!module.exports.isNumeric(target.substring(0, 1)) && !["test.getproxylist.com", "www.giswd.com", "ip-api.com", "deploy.vinii.de"].includes(target)){

                        if(isTiny){
                            if(result['tiny.rip'] == undefined)
                                result['tiny.rip'] = 3
                        }else{
                            result[target] = 1;
                        }

                    }
                } else {

                    if(isTiny){
                        result['tiny.rip'] = result['tiny.rip'] + 3
                    } else {
                        result[target] = result[target] + 1
                    }

                }
            }
        })
        
        insertCache("nginx_request_log", "1", result);

        return result;
    },

    isNumeric(str) {
        if (typeof str != "string") return false;
    
        return !isNaN(str) && !isNaN(parseFloat(str));
    }
}