const { execSync } = require('child_process');
const { deploymentPath } = require('../../config');
const { decryptText } = require('../generation/generator');

const fs = require('fs'), fsp = require('fs').promises;

module.exports = {


    isDeployed(name) {
        if (process.env.NODE_ENV == "development") return false;

        try {
            return fs.existsSync(deploymentPath + name) && fs.existsSync(deploymentPath + name + "/deployment_ecosystem.config.js")
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


    cloneRepository(user, repo, override) {
        if (process.env.NODE_ENV == "development") return true;

        try {
            if (fs.existsSync(deploymentPath + repo.name) || override) {
                const masterLink = `https://github.com/${repo.owner.login}/${repo.name}/archive/refs/heads/master.zip`

                execSync(`curl -H "Authorization: token ${decryptText(user.access_token)}" -L ${masterLink} --output ${deploymentPath}/${repo.name}/${repo.name}-repository.zip`);

                return fs.existsSync(deploymentPath + repo.name + `/${repo.name}-repository.zip`);
            } else {
                console.log()
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
        if (process.env.NODE_ENV == "development") return ["deployment-manager", "CryptChat"];

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
}