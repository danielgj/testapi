///////
// Funciones Auxiliares
///////

var bCrypt = require('bcrypt-nodejs');


module.exports = {
    

    createHash: function(password){
        return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
    },

    isValidPassword: function(p1, p2){
        return bCrypt.compareSync(p1, p2);
    },

    createStringRKey: function(length) {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for(var i = 0; i < length; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    },

    
    TYPES: {
        'undefined'        : 'undefined',
        'number'           : 'number',
        'boolean'          : 'boolean',
        'string'           : 'string',
        '[object Function]': 'function',
        '[object RegExp]'  : 'regexp',
        '[object Array]'   : 'array',
        '[object Date]'    : 'date',
        '[object Error]'   : 'error'
    },
    
    TOSTRING: Object.prototype.toString,

    type: function(o) {
        return this.TYPES[typeof o] || this.TYPES[this.TOSTRING.call(o)] || (o ? 'object' : 'null');
    },
    
    ///////////////// Aux functions for schedulled notifications
    chunk: function(arr, len) {
      var chunks = [],
          i = 0,
          n = arr.length;

      while (i < n) {
        chunks.push(arr.slice(i, i += len));
      }

      return chunks;
    },

    getNowString: function() {
    
        var today = new Date();
        var d = today.getDate();
        var m = today.getMonth()+1; //January is 0!
        var y= today.getFullYear();
        var hh = today.getHours();
        var mm = today.getMinutes();

        if(d<10) {
            d='0'+d
        } 

        if(m<10) {
            m='0'+m
        } 

        if(hh<10) {
            hh = '0' + hh;
        }

        if(mm<10) {
            mm = '0' + mm;
        }

        var fNow = y +'-'+m+'-'+d + "T" + hh + ":" + mm + ":00Z";

        return fNow;

    },

    getFormatedDateString: function(inputDate, inputHour) {
    
        var y= inputDate.substr(0,4);
        var m = inputDate.substr(5,2);
        var dS = inputDate.substr(8,2);

        d = (parseInt(dS) + 1);

        if(d<10) {
            d='0'+d
        } 

        var fNow = y +'-'+m+'-'+d + "T" + inputHour +  ":00Z";

        return fNow;

    },

    compareToNowInMinutes: function(inputDate, inputHour) {
    
        var formatedDateString = this.getFormatedDateString(inputDate,inputHour);
        var formatedNowString = this.getNowString();

        var notDate = new Date(formatedDateString);
        var nowDate = new Date(formatedNowString);

        var timeDiff = (nowDate.getTime() - notDate.getTime())/(1000*60); //in minutes

        if(timeDiff>0) {
            return true;    
        } else {
            return false;
        }
    }
}