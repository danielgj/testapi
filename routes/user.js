const express = require('express');
const { v4: uuidv4 } = require('uuid');
const bodyparser = require('body-parser');
const _ = require('underscore');
const userSchema = require('../schemas/user');
const jwt = require('jsonwebtoken');
const jwtM = require('express-jwt');
const nFunctions = require('../auxiliar');

module.exports = (config, messages, db) => {
    
    const userRouter = express.Router();

    userRouter.use(bodyparser.json());
    userRouter.use(bodyparser.urlencoded({ extended: false }));
    
    userRouter.route('/')
    
    ////
    // Create User
    ////
    .post((req,res) => {
      const bodyReq = req.body;     
             
      if (!bodyReq) {
        return res.status(400).send({ msg: messages.bad_request_msg });
      }
      
      const { inputError, value } = userSchema.validate(bodyReq);
      if (inputError) {
        return res.status(400).send(inputError);
      }

      const users = db.get('users');

      const existingUser = users.find((user) => user.username === bodyReq.username);
      if (existingUser) {
        return res.status(400).send({msg: 'User already exists'});
      }

      const userToCreate = {
        id: uuidv4(),
        username: bodyReq.username,
        password: nFunctions.createHash(bodyReq.password),
        email: bodyReq.email,
        role: 'agent'
      };
      users.push(userToCreate);
      db.set(users, 'users');
      
      // No validation error, check if user exists in DB
      return res.status(201).send({msg: 'User created'});
      
    })

    ////
    // Get Users
    ////
    .get(jwtM({secret: config.jwtPassword}), (req, res) => {
        const userR = req.user;
        if (!userR || userR.role!='admin') {
            return res.status(401).send(messages.unauthorized_error);
        }
        const users = db.get('users');
        return res.status(200).send(users);        
    });
    
    userRouter.route('/:id')    
    
    .get(jwtM({secret: config.jwtPassword}), (req,res) => {
            
            const userR = req.user;
            if (!userR || userR.role!='admin') {
                return res.status(401).send(messages.unauthorized_error);
            }

            const users = db.get('users');

            const existingUser = users.find((user) => user.id === req.params.id);
            if (!existingUser) {
              return res.status(404).send({msg: 'User not found'});
            }
            return res.status(200).send(existingUser);
          });
    
    
    ////
    // Login
    ////
    userRouter.post('/login', (req,res) => {
      const bodyReq = req.body;          

      if(!bodyReq || !_.has(bodyReq,'email') || !_.has(bodyReq,'password')) {
          return res.status(400).send({ msg: messages.bad_request_msg });
      }

      const users = db.get('users');
      const data = users.find((user) => user.email === bodyReq.email);
      if (!data) {
        //User not exists
        return res.status(404).json({msg: messages.user_not_found_msg});
      }
      
      var dbPass = data.password;                                                                              
      if(nFunctions.isValidPassword(req.body.password,dbPass)) {
              
        const payload = {
          userid : data.id,                    
          username : data.username,
          role : data.role
        };
        const token = jwt.sign(payload, config.jwtPassword, { expiresInMinutes: config.jwtTokenExpiresIn });
    
        return res.status(200).json({
          userid: data.id,
          token: token
        });

    } else {
      return res.status(401).json({ msg: messages.bad_pwd_msg });
    }

  });
  
  return userRouter;
    
}

