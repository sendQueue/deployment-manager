const { genIP } = require("./generation/generator");
const { getGithubUser } = require("./network/g_helper");

const mysql = require("nodejs-mysql").default;

const db = mysql.getInstance({
    host: process.env.SQL_HOST,
    port: process.env.SQL_PORT,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASS,
    database: process.env.SQL_DB
});


module.exports = {
    async runStartUpChecks() {
        let success = true;

        // users table
        await db.exec("SELECT EXISTS( SELECT * FROM information_schema.tables WHERE table_schema = ? AND table_name = ? ) AS success", [process.env.SQL_DB, "users"]).then(async rows => {
            if (rows[0]["success"] == 0) {
                await db.exec("CREATE TABLE users (uuid int(4) UNSIGNED ZEROFILL NOT NULL, username varchar(255) NOT NULL, password varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL, access_token varchar(255) NOT NULL, denied text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;").then(async rows2 => {
                    await db.exec("ALTER TABLE `users` ADD PRIMARY KEY (`uuid`);");
                    await db.exec("ALTER TABLE `users` MODIFY `uuid` int(4) UNSIGNED ZEROFILL NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;");
                    await db.exec("COMMIT;")
                    success = rows2["serverStatus"] == 2
                })
            }
        })

        // logins/sessionRefreshes table
        await db.exec("SELECT EXISTS( SELECT * FROM information_schema.tables WHERE table_schema = ? AND table_name = ? ) AS success", [process.env.SQL_DB, "logins"]).then(async rows => {
            if (rows[0]["success"] == 0) {
                await db.exec("CREATE TABLE `logins` (`id` int NOT NULL, `uuid` varchar(4) COLLATE utf8mb4_unicode_ci NOT NULL, `time` varchar(13) COLLATE utf8mb4_unicode_ci NOT NULL,`ip` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;").then(async rows2 => {
                    await db.exec("ALTER TABLE `logins` ADD PRIMARY KEY (`id`);");
                    await db.exec("ALTER TABLE `logins` MODIFY `id` int NOT NULL AUTO_INCREMENT;");
                    await db.exec("COMMIT;")
                    success = rows2["serverStatus"] == 2
                })
            }
        })

        // starts table
        await db.exec("SELECT EXISTS( SELECT * FROM information_schema.tables WHERE table_schema = ? AND table_name = ? ) AS success", [process.env.SQL_DB, "starts"]).then(async rows => {
            if (rows[0]["success"] == 0) {
                await db.exec("CREATE TABLE `starts` (`id` int NOT NULL, `uuid` varchar(4) COLLATE utf8mb4_unicode_ci NOT NULL, `deployment` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL, `time` varchar(13) COLLATE utf8mb4_unicode_ci NOT NULL,`ip` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;").then(async rows2 => {
                    await db.exec("ALTER TABLE `starts` ADD PRIMARY KEY (`id`);");
                    await db.exec("ALTER TABLE `starts` MODIFY `id` int NOT NULL AUTO_INCREMENT;");
                    await db.exec("COMMIT;")
                    success = rows2["serverStatus"] == 2
                })
            }
        })

        // stops table
        await db.exec("SELECT EXISTS( SELECT * FROM information_schema.tables WHERE table_schema = ? AND table_name = ? ) AS success", [process.env.SQL_DB, "stops"]).then(async rows => {
            if (rows[0]["success"] == 0) {
                await db.exec("CREATE TABLE `stops` (`id` int NOT NULL, `uuid` varchar(4) COLLATE utf8mb4_unicode_ci NOT NULL, `deployment` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL, `time` varchar(13) COLLATE utf8mb4_unicode_ci NOT NULL,`ip` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;").then(async rows2 => {
                    await db.exec("ALTER TABLE `stops` ADD PRIMARY KEY (`id`);");
                    await db.exec("ALTER TABLE `stops` MODIFY `id` int NOT NULL AUTO_INCREMENT;");
                    await db.exec("COMMIT;")
                    success = rows2["serverStatus"] == 2
                })
            }
        })


        return success;
    },


    insertLogin(req, uuid){
        //db.exec("INSERT INTO `logins` (`id`, `uuid`, `time`, `ip`) VALUES (NULL, ?, ?, ?);", [uuid, Date.now(), genIP(req)]);
    },


    async getUserByName(username) {
        var user = undefined;
        await db.exec("SELECT * FROM users WHERE username = ?", [username]).then(async rows => {
            if (rows.length > 0)
                user = await module.exports.genUserObject(rows[0]);
        });
        return user;
    },

    async getUserByUUID(uuid) {
        var user = undefined;
        await db.exec("SELECT * FROM users WHERE uuid = ?", [uuid]).then(async rows => {
            if (rows.length > 0)
                user = await module.exports.genUserObject(rows[0]);
        });
        return user;
    },


    async genUserObject(row) {
        let user = {
            uuid: row['uuid'],
            username: row['username'],
            password: row['password'],
            access_token: row['access_token'],
            denied: row['denied'],
            github_user: {

            },
            session_age: Date.now()
        }

        if (user.access_token.length > 0) {
            await getGithubUser(user, g_user => {
                user.github_user = g_user;
            });
        }
        return user
    }
}