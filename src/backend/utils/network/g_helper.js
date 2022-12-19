const fetch = require("node-fetch");
const { isValid, insertCache } = require("../cache");
const { decryptText } = require("../generation/generator");

module.exports = {
    async getGithubUser(user, callback){
        const cache = isValid("github_token", user.uuid, 300);

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
                insertCache("github_token", user.uuid, g_user);
                callback(g_user);
            } catch (error) {
                callback();
            }
        });
    },

    
    async getGithubRepos(user, callback) {
        const cache = isValid("github_repos", user.uuid, 320);

        if(cache !== false){
            callback(cache);
            return;
        }

        await fetch("https://api.github.com/user/repos?sort=pushed", {
            headers: {
                'User-Agent': 'deployment manager - contact: admin@vinii.de',
                Authorization: 'Token ' + decryptText(user.access_token)
            }
        }).then(async result => {
            try {
                const repos = JSON.parse(await result.text());
                insertCache("github_repos", user.uuid, repos);
                callback(repos);
            } catch (error) {
                callback();
            }
        })
    },

    
    async getGithubRepo(user, repo, callback){
        const cache = isValid("github_repo_" + repo.name, user.uuid, 30);

        if(cache !== false){
            callback(cache);
            return;
        }

        await fetch(`https://api.github.com/repos/${repo.owner.login}/${repo.name}/git/refs/heads/${repo.default_branch}`, {
            headers: {
                'User-Agent': 'deployment manager - contact: admin@vinii.de',
                Authorization: 'Token ' + decryptText(user.access_token)
            }
        }).then(async result => {
            try {
                const fullRepo = JSON.parse(await result.text());
                insertCache("github_repo_" + repo.name, user.uuid, fullRepo);
                callback(fullRepo);
            } catch (error) {
                callback()
            }
        })
    }
}