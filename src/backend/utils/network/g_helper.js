const fetch = require("node-fetch");
const { isValid, insertCache } = require("../cache");
const { decryptText } = require("../generation/generator");

module.exports = {
    async getGithubUser(user, callback){
        const cache = isValid('github_token', user.uuid, 300);

        if (cache !== false) {
            callback(cache);
            return;
        }

        await fetch("https://api.github.com/user", {
            headers: {
                'User-Agent': 'deployment manager - contact: admin@vinii.de',
                Authorization: 'Token ' + decryptText(user.access_token)
            }
        }).then(async result => {
            try {
                const g_user = JSON.parse(await result.text());
                if(!g_user["login"]){
                    callback();
                    return;
                }
                insertCache('github_token', user.uuid, g_user);
                callback(g_user);
            } catch (error) {
                callback();
            }
        });
    }
}