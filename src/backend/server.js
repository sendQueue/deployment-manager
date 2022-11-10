const mysql2 = require("mysql2/promise");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const bodyParser = require("body-parser");

const path = require("path");


const express = require("express");
const { runStartUpChecks } = require("./utils/sql");

const app = express();

const PORT = process.env.PORT || 49998;

/*
 * running start up checks and cancel startup if failed
 */
if(!runStartUpChecks()){
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

app.listen(PORT, () => console.log(`listening to http://localhost:${PORT}`));