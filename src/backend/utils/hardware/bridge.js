const { deploymentPath } = require('../../config');

const fs = require('fs'), fsp = require('fs').promises;

module.exports = {


    isDeployed(name) {
        if (!process.env.PRODUCTION) return false;

        try {
            return fs.existsSync(deploymentPath + name) && fs.existsSync(deploymentPath + name + "/deploy_ecosystem.config.js")
        } catch (error) {
            return false;
        }
    }

}