const mongoose = require('mongoose');

// main().catch(err => console.log(err));

async function main() {
   try{
        const conn =await mongoose.connect(process.env.DB_CONNECTION_STRING)
        console.log(`MongoDB connected: ${conn.connection.host}`)
    }catch(err){
        console.error(err)
    }
}
module.exports={main}