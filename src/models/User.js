import mongoose from 'mongoose';
import roundSchema from './Round.js';

const userSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v);
      },
      message: props => `${props.value} is not a valid email address`
    }
  },
  accountInfo: {
    password: {
      type: String,
      required: true
    },
    securityQuestion: {
      type: String,
      required: true
    },
    securityAnswer: {
      type: String,
      required: true
    }
  },
  identityInfo: {
    displayName: String,
    profilePic: String
  },
  speedgolfInfo: {
    bio: {
      type: String, 
      maxLength: 500},
    homeCourse: String,
    firstRound: Date,
    personalBest: {
      strokes: Number,
      seconds: Number,
      course: String
    },
    clubs: {
      "1W": {type: Boolean, default: false},
      "3W": {type: Boolean, default: false},
      "4W": {type: Boolean, default: false},
      "5W": {type: Boolean, default: false},
      Hybrid: {type: Boolean, default: false},
      "1I": {type: Boolean, default: false},
      "2I": {type: Boolean, default: false},
      "3I": {type: Boolean, default: false},
      "4I": {type: Boolean, default: false},
      "5I": {type: Boolean, default: false},
      "6I": {type: Boolean, default: false},
      "7I": {type: Boolean, default: false},
      "8I": {type: Boolean, default: false},
      "9I": {type: Boolean, default: false},
      PW: {type: Boolean, default: false},
      GW: {type: Boolean, default: false},
      SW: {type: Boolean, default: false},
      LW: {type: Boolean, default: false},
      Putter: {type: Boolean, default: false}
    },
    clubComments: String,
  },
  rounds: [roundSchema]
});

const User = mongoose.model('User', userSchema);
export default User;

