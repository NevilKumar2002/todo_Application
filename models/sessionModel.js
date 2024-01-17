const mongoose= require('mongoose');
const Schema= mongoose.Schema;
const sessionModel= new Schema({_id:String},{strict:false});
module.exports= new mongoose.model("session", sessionModel);