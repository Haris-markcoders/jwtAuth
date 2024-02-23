const mongoose = require("mongoose");

const UserSchema=new mongoose.Schema({
    username:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    verified:{
        type:Boolean,
        default:false
    },
    verificationCode:{
        type:Number
    },
    paymentVerified:{
        type:Boolean,
        default:false
    },
    customerId:{
        type:String,
        default:''
    }
},{ database:"jwtauth" })
const User= mongoose.model('User', UserSchema);


module.exports={User}