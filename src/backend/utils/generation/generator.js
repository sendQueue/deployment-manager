const crypto = require('crypto'), algorithm = 'aes-256-ctr', password = process.env.SECRET;
module.exports = {
    hashPassword(password) {
        // ampere cpu does not like bcrypt :/

        // const bcrypt = require('bcrypt')
        // return bcrypt.hashSync(password, 10)
        return module.exports.encryptText(password)
    },


    comparePassword(password, hash) {
        // const bcrypt = require('bcrypt')
        // return bcrypt.compareSync(password, hash)
        return (password) == module.exports.decryptText(hash)
    },


    encryptText(text) {
        let iv = crypto.randomBytes(16);
        let cipher = crypto.createCipheriv(algorithm, Buffer.concat([Buffer.from(password), Buffer.alloc(32)], 32), iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    },


    decryptText(text) {
        let textParts = text.split(':');
        let iv = Buffer.from(textParts.shift(), 'hex');
        let encryptedText = Buffer.from(textParts.join(':'), 'hex');
        let decipher = crypto.createDecipheriv(algorithm, Buffer.concat([Buffer.from(password), Buffer.alloc(32)], 32), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    },

    
    async genIP(req) {
        return req.headers['cf-connecting-ip'] ||
            req.headers['x-real-ip'] ||
            req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            (req.connection.socket ? req.connection.socket.remoteAddress : null) || 1;
    },

}