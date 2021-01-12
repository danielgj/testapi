const express = require('express');
const { v4: uuidv4 } = require('uuid');
const bodyparser = require('body-parser');
const _ = require('underscore');
const sessionSchema = require('../schemas/session');
const jwt = require('jsonwebtoken');
const jwtM = require('express-jwt');

module.exports = (config, messages, db) => {
    
    const sessionRouter = express.Router();

    sessionRouter.use(bodyparser.json());
    sessionRouter.use(bodyparser.urlencoded({ extended: false }));
    
    sessionRouter.route('/')
    
    ////
    // Create Session
    ////
    .post(jwtM({secret: config.jwtPassword}), function(req, res) {

        const userR = req.user;
        if (!userR || userR.role!='admin') {
            return res.status(401).send(messages.unauthorized_error);
        }

        const bodyReq = req.body;     
             
        if (!bodyReq) {
            return res.status(400).send({ msg: messages.bad_request_msg });
        }
        
        const { inputError, value } = sessionSchema.validate(bodyReq);
        if (inputError) {
            return res.status(400).send(inputError);
        }

        const sessions = db.get('sessions');

        const sessionToCreate = {
            id: uuidv4(),
            owner: userR.id,
            ...bodyReq
        };
        sessions.push(sessionToCreate);
        db.set(sessions, 'sessions');
      
        // No validation error, check if user exists in DB
        return res.status(201).send(sessionToCreate);
      
    })

    ////
    // Get User Sessions
    ////
    .get(jwtM({secret: config.jwtPassword}), function(req, res) {
        var userR = req.user;
        if (!userR) {
            return res.status(401).send(messages.unauthorized_error);
        }
        const sessions = db.get('sessions');
        return res.status(200).send((sessions || []).filter((s) => s.owner === userR.id));        
    });
    
    userRouter.route('/:id')    
    
    .get(jwtM({secret: config.jwtPassword}), (req,res) => {
            
            var userR = req.user;
            if (!userR) {
                return res.status(401).send(messages.unauthorized_error);
            }

            const sessions = db.get('sessions');

            const existingSession = sessions.find((s) => s.id === s.params.id);
            if (!existingSession) {
              return res.status(404).send({msg: 'Session not found'});
            }
            if (existingSession.owner !== userR.id) {
                return res.status(401).send(messages.unauthorized_error);
            }
            return res.status(200).send(existingSession);
          });
    
    
    
  return sessionRouter;
    
}

