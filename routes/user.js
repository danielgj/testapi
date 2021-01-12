var express = require('express');
var status = require('http-status');
var bodyparser = require('body-parser');
var _ = require('underscore');
var jwt = require('jsonwebtoken');
var jwtM = require('express-jwt');
var nFunctions = require('../auxiliar');

module.exports = function(wagner, config, messages) {
    
    var userRouter = express.Router();

    userRouter.use(bodyparser.json());
    userRouter.use(bodyparser.urlencoded({ extended: false }));
    
    userRouter.route('/')
    
    
    ////
    // Create User
    ////
    .post(function(req,res) {
        

          return wagner.invoke(function(User) {

            var bodyReq = req.body;     
             
            if(!bodyReq || !_.has(bodyReq,'username') || !_.has(bodyReq,'password') || !_.has(bodyReq,'email') || !_.has(bodyReq,'role')) {
              return res.status(400).send({ msg: messages.bad_request_msg });
            } else {
              return User.findOne({username: bodyReq.username}, function (err, data) {

                    if(err) {
                      console.log(err);
                      return res.status(500).json({ msg: messages.internal_server_error });
                    } else {
                        if(data) {
                            //User exists
                            return res.status(404).json({msg: 'el usuario ya existe'});
                        } else {

                            return wagner.invoke(function(User) {
                                var userToCreate = {
                                    username: bodyReq.username,
                                    password: nFunctions.createHash(bodyReq.password),
                                    email: bodyReq.email,
                                    role: bodyReq.role
                                };


                                return User.create(userToCreate, function(err,data) {
                                    if(err) {
                                          console.log(err);
                                          return res.status(500).json({ msg: 'Internal Server Error' });
                                    } else {
                                          return res.status(201).json(data);
                                    }                
                                });
                            });
                      }
                  }
            });
        
            }
       });
      
      
    })

    ////
    // Get Users
    ////
    .get(jwtM({secret: config.jwtPassword}), function(req, res) {
    
        var userR = req.user;
        if (!userR || userR.role!='admin') {
            return res.status(401).send(messages.unauthorized_error);
        } else {
            return wagner.invoke(function(User) {
                User.
                find().
                exec(nFunctions.handleOne.bind(null, 'users', res));                
                        
            });                
        }        
    });
    
    userRouter.route('/:id')    
    
    .delete(jwtM({secret: config.jwtPassword}), wagner.invoke(function(User) {
        
        return function(req,res) {
            
            var userR = req.user.role;
            if (userR!='adminuser') {
                return res.status(401).send(messages.unauthorized_error);
            } else {

                
                      return User.remove({_id: req.params.id}, function(err,data) {
                            if(err) {
                                return res.status(500).json({ msg: 'Internal Server Error' });
                            } else {
                                return res.status(201).json(data);
                            }                
                      });

            }

        };

    }));
    
    
    userRouter.route('/changepass/:id')
    
    ////
    // Update User Password
    ////
    .put(jwtM({secret: config.jwtPassword}), wagner.invoke(function(User) {
        
        return function(req,res) {
            
            var userR = req.user.role;
            if (userR!='adminuser') {
                return res.status(401).send(messages.unauthorized_error);
            } else {

                var bodyReq = req.body;          

                if(!bodyReq || !_.has(bodyReq,'password')) {            
                  return res.status(400).send({ msg: messages.bad_request_msg });
                } else {

                    var userToUpdate = {
                        password: nFunctions.createHash(bodyReq.password)
                    };
                    
                    return User.update({_id: req.params.id}, userToUpdate, {upsert: true}, function(err,data) {
                        if(err) {
                            return res.status(500).json({ msg: 'Internal Server Error' });
                        } else {
                            return res.status(201).json(data);
                        }                
                    });

               }
            }

        };

    }))
      
    
    ////
    // Login
    ////
    userRouter.post('/login', wagner.invoke(function(User) {

      return function(req,res) {

        var bodyReq = req.body;          

        if(!bodyReq || !_.has(bodyReq,'user') || !_.has(bodyReq,'password')) {
          return res.status(400).send({ msg: messages.bad_request_msg });
        } else {

          return User.
           findOne({username: req.body.user}).
           populate('applications').
           exec( function (err, data) {

            if(err) {
              return res.status(500).json({ msg: messages.internal_server_error });
            } else {
                if(!data) {
                    //User not exists
                    return res.status(404).json({msg: messages.user_not_found_msg});
                } else {
                    //Check pass
                    var dbPass = data.password;
                                                                                
                    if(nFunctions.isValidPassword(req.body.password,dbPass)) {
                          

                                  
                                  var payload = {
                                        userid : data._id,                    
                                        username : data.username,
                                        role : data.role};

                                  var token = jwt.sign(payload, config.jwtPassword, { expiresInMinutes: config.jwtTokenExpiresIn });

                                  var payloadRefresh = {
                                          userid : data._id,
                                          username : data.username,                                          
                                          role : data.role,
                                          token: token};

                                  var refresh = jwt.sign(payloadRefresh, config.jwtPassword, { expiresInMinutes: config.jwtrefreshExpiresIn });
                                  
                                  return res.status(200).json({
                                    userid: data._id,
                                    token: token,
                                    refresh: refresh});

                    } else {
                                return res.status(401).json({ msg: messages.bad_pwd_msg });
                    }
                    

                    
                }
            }
        });
       }

       };

       }))
 

    ////
    // Refresh
    ////
    userRouter.post('/refresh', wagner.invoke(function(User) {

        return function(req,res) { 
            
          var refresh = req.body.refresh;

          jwt.verify(refresh,config.jwtPassword, function(err, decoded) {

            if(err==null) {

              return User.findOne({_id: decoded.userid}, function (err, data) {

                if(err) {
                  return res.status(500).json({ msg: messages.internal_server_error });
                } else {
                  if(!data) {
                    //User not exists
                    return res.status(404).json({msg: messages.user_not_found_msg});
                  } else {

                    var payload = {
                        userid : data._id,                    
                        username : data.username,
                        role : data.role};

                        var token = jwt.sign(payload, config.jwtPassword, { expiresInMinutes: config.jwtTokenExpiresIn });

                        var payloadRefresh = {
                          userid : data._id,
                          username : data.username,
                          role : data.role,
                          token: token};

                          var refresh = jwt.sign(payloadRefresh, config.jwtPassword, { expiresInMinutes: config.jwtrefreshExpiresIn });

                          return res.status(200).json({
                            userid: data._id,
                            username : data.username,
                            role: data.role,
                            token: token,
                            refresh: refresh});

                        }
                      }
                    });

                  } else {
                    if(err.message==messages.invalid_signature_error) {
                      res.status(401).send(messages.unauthorized_error);
                    } else if(err.message==messages.jwt_expired_error) {
                      res.status(449).send(messages.refresh_expired_msg);
                    } else {
                      res.status(500).send(messages.unexpected_error);
                    }
                  }
                });
         
        }
    
    }));      
    
    
    return userRouter;
    
}

