var express = require('express');
var bodyparser = require('body-parser');

module.exports = (messages) => {
    
    const mdRouter = express.Router();

    mdRouter.use(bodyparser.json());
    mdRouter.use(bodyparser.urlencoded({ extended: false }));
    
    
    mdRouter.get('/', function(req, res, next) {        
      res.render('index', { title: messages.welcome });
    });
    
    return mdRouter;
    
}