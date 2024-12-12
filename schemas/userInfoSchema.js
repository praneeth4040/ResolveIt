const mongoose = require("mongoose")

const UserSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
      },
      phoneno: {
        type: Number,
        required: true,
      },
      email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
      },
      password: {
        type: String,
        required: true,
        minlength : 6
      }
    });

    const UserInfo = mongoose.model('UserInfo',UserSchema);
    module.exports = UserInfo;