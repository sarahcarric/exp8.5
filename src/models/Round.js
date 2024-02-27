import mongoose from 'mongoose';

const roundSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  course: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum : ['practice','tournament'],
    required: true
  },
  strokes: {
    type: Number,
    required: true,
    min: 1,
    max: 300
  },
  seconds: {
    type: Number,
    required: true,
    min: 0,
    max: 21600
  },
  notes: String
});

roundSchema.virtual('SGS').get(function() {
  const totalSeconds = (this.strokes * 60) + this.seconds;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return (minutes + ":" + seconds.toString().padStart(2,'0'));
});

roundSchema.virtual('time').get(function() {
  const minutes = Math.floor(this.seconds / 60);
  const seconds = this.seconds % 60;
  return (minutes + ":" + seconds.toString().padStart(2,'0'));
});

//const Round = mongoose.model('Round', roundSchema);
export default roundSchema;