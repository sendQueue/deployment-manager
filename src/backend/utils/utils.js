const { insertLogin } = require("./sql")

module.exports = {

    setSession(req, user, maxAgeInDays) {
        insertLogin(req, user.uuid);
        if(maxAgeInDays){
            //daysInMS * age
            const hour = (3600000 * 24) * maxAgeInDays
            req.session.cookie.expires = new Date(Date.now() + hour)
            req.session.cookie.maxAge = hour
        }
        req.session.user = user
    },


    setState(res, state) {
        res.json({ state: state });
    },


    isNumeric(str) {
        if(typeof str != "string") return false;

        return !isNaN(str) && !isNaN(parseFloat(str));
    },


    escapeRegExp(string) {
        return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
    },

    replaceAll(str, find, replace) {
        return str.replace(new RegExp(module.exports.escapeRegExp(find), 'g'), replace);
    }
}