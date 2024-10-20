const mysql2 = require("mysql2/promise");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const bodyParser = require("body-parser");

const path = require("path");


const express = require("express");
const { runStartUpChecks } = require("./utils/sql");
const { writeEcosystem } = require("./utils/hardware/bridge");

const app = express();

const PORT = process.env.PORT || 1347;

/*
 * running start up checks and cancel startup if failed
 */
if (!runStartUpChecks()) {
    console.error("failed to start up deployment manager")
    // exit ungracefully
    process.exit(1);
}


const connection = mysql2.createPool({
    host: process.env.SQL_HOST,
    port: process.env.SQL_PORT,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASS,
    database: process.env.SQL_DB
});

const sessionStore = new MySQLStore({}, connection);

app.use(express.json());

app.use(express.static(path.join(__dirname, '../frontend')));
app.use(bodyParser.json({ limit: "20mb" }));


/*
 *  https://github.com/expressjs/express/issues/3002
 *  default: 2
 */
app.set("subdomain offset", 0);

/*
 *  behind nginx proxy; migrate to ip specific: app.set('trust proxy', '127.0.0.1') 
 */
app.set("trust proxy", true);


app.use((req, res, next) => {
    /*
    *  force ssl in production
    */
    if (!req.headers.host.includes("localhost") && req.headers['x-forwarded-proto'] !== 'https') {
        return res.redirect('https://' + req.headers.host + req.url);
    }
    return next();
})


app.use('*', session({
    secret: process.env.SESSION_KEY,
    resave: true,
    saveUninitialized: false,
    store: sessionStore
}))


require("./utils/routes/helpers")(app);
require("./utils/routes/router")(app);
require("./utils/routes/v2")(app);

app.get("/", (req, res) => res.send());

app.listen(PORT, () => {
    clock()
    console.log(`listening to http://localhost:${PORT}`)
});


const fetch = require("node-fetch");

async function clock() {

    await fetch("https://www.syssec.wiwi.uni-due.de/studium-lehre/sommersemester-23/seminar-systemsicherheit-seminar-14474/").then(async response => {
        const result = await response.text();
        console.log(result)
        var lastChange = result.split("<li>Letzte Änderung:")[1].split("</li>")[0].trim()
        if (lastChange != "01.03.2023") {
            sendPage("Seminar");
        }
    })

    await fetch("https://www.syssec.wiwi.uni-due.de/studium-lehre/sommersemester-23/").then(async response => {
        const result = await response.text();
        var lastChange = result.split("<li>Letzte Änderung:")[1].split("</li>")[0].trim()
        if (lastChange != "01.03.2023") {
            sendPage("Angebote");
        }
    })

    setTimeout(() => {
        clock();
    }, 1000 * 60 * 60);

}

async function sendPage(msg) {
    await fetch("https://events.pagerduty.com/v2/enqueue", {
        "method": "POST",
        "headers": {
            "Content-Type": "application/json"
        },
        "body": JSON.stringify(
        {
            "payload": {
                "summary": "Seminar Update",
                "timestamp": new Date(),
                "source": "deployment-manager bot",
                "severity": "critical",
                "component": "postgres",
                "group": "prod-datapipe",
                "class": "change",
            },
            "routing_key": "R03DRTCBN61I4Z0QHHITYQ6LLAI9DYO6",
            "dedup_key": "R03DRTCBN61I4Z0QHHITYQ6LLAI9DYO6",
            "links": [
                {
                    "href": "https://www.syssec.wiwi.uni-due.de/studium-lehre/sommersemester-23/",
                    "text": msg
                }
            ],
            "event_action": "trigger",
        })
    }).then(response => {
        console.log(response);
    })
}