import { Schema, model } from "mongoose";

const UserSchema=new Schema({
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
export const User= model('User', UserSchema);
