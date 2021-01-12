var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var userSchema = {
    username: {
      type: String,
      required: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: false
    },
    role: {
      type: String,
      enum: ['developer','admin']
    }
};

var schema = new mongoose.Schema(userSchema, {timestamps: true});

schema.index({ name: 'username' });

module.exports = schema;
module.exports.userSchema = userSchema;
