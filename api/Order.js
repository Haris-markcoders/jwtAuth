const mongoose = require("mongoose");

const OrderSchema=new mongoose.Schema({
    po: {
      type: String,
      required: true,
    },
    store_id: {
      type: String,
      required: true,
    },
    order_detail: {
      type: Object,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    fulfilled:{
        type:Boolean,
        default:false
    }
},{ database:"jwtauth" })
const Order= mongoose.model('Order', OrderSchema);


module.exports={Order}