module.exports = {
    cache: {
        
    },


    isValid(key, uuid, maxAge) {
        if (!module.exports.cache[key]) return false;

        const entry = module.exports.cache[key][uuid];

        if (entry != undefined
            && Date.now() - entry["time"] < maxAge * 1000) {
            return entry["body"];
        }

        return false;
    },


    insertCache(key, uuid, body) {
        if (!module.exports.cache[key]) {
            module.exports.cache[key] = {};
        }

        module.exports.cache[key][uuid] = {
            time: Date.now(),
            body: body
        }
        
        return module.exports.cache[key][uuid];
    },


    clearCache(key, uuid) {
        module.exports.cache[key][uuid] = undefined;
    },

    clearCache(key){
        module.exports.cache[key] = undefined;
    },

    clearCache(){
        module.exports.cache = {}
    }

}