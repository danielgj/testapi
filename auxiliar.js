const bCrypt = require('bcryptjs');

module.exports = {
    createHash: function(password){
        return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
    },

    isValidPassword: function(p1, p2){
        return bCrypt.compareSync(p1, p2);
    },
}