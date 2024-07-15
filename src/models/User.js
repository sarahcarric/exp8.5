/*****************************************************************************
 * @file User.js
 * @description Defines the User model schema using Mongoose.
 ****************************************************************************/
import mongoose from 'mongoose';
import roundSchema from './Round.js';

const userSchema = new mongoose.Schema({
  accountInfo: {
    email: {
      type: String,
      required: [true, 'User email is required'],
      unique: true,
      trim: true,
      validate: {
        validator: function(v) {
          return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v);
        },
        message: props => `${props.value} is not a valid email address`
      }
    },
    password: {
      type: String,
      required: true
    },
    emailVerified: {
      type: Boolean,
      default: false
    },
    verificationDueBy: {
      type: Date,
      default: () => new Date(Date.now() + 1000*60*60*24) //24 hours from now
    },
    passResetToken: {
      type: String,
      default: null
    },
    passResetVerfiedToken: {
      type: String,
     default: null
    }
  },
  identityInfo: {
    displayName: {
      type: String,
      default: ""
    },
    profilePic: {
      type: String,
      default: "images/DefaultProfilePic.jpg",
    }
  },
  speedgolfInfo: {
    bio: {
      type: String, 
      maxLength: 500,
      default: ""},
    homeCourse: {
      type: String,
      default: ""},
    firstRound: {
      type: Date,
      default: Date.now
    },
    personalBest: {
      strokes: {
        type: Number,
        default: 100
      },
      seconds: {
        type: Number,
        default: 5400
      },
      course: {
        type: String,
        default: ""
      }
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
    clubComments: {
      type: String,
      default: ""
    }
  },
  rounds: [roundSchema]
});

const User = mongoose.model('User', userSchema);

User.init().catch(error => console.log(error));

export default User;