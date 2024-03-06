const dotenv=require('dotenv').config()
const jwt = require('jsonwebtoken');
const {User}=require('../models/User')
const stripe=require('stripe')(process.env.STRIPE_KEY)

function generateAccessToken(user) {
  try{
    const payload = {
      userID:user._id
    };
    
    const secret = 'your-secret-key';
    const options = { expiresIn: '1h' };
  
    return jwt.sign(payload, secret, options);
  }catch(e){
    console.log(e)
  }
}

function verifyAccessToken(token) {
    const secret = 'your-secret-key';
    try {
      const decoded = jwt.verify(token, secret);
      return { success: true, data: decoded };
    } catch (error) {
      console.log(e)
      return { success: false, error: error.message };
    }
}

function authenticateToken(req, res, next) {
    try{
      const token = req.headers['authorization'];
      if (!token) {
        return res.sendStatus(401);
      }
      const result = verifyAccessToken(token);
      if (!result.success) {
        return res.status(403).json({ error: result.error });
      }
      req.user = result.data;
      next();
    }catch(e){
      console.log(e)
    }
}

async function authenticateUserEmail(req,res,next){
  try{    
    const {userID}=req.user
    const currentUser=await User.findById(userID)
    // console.log(userID)
    console.log(currentUser)
    if(currentUser.verified){
      next()
      // console.log(req)
    }else{
      res.status(401).json({"message":"user not verified"})
    }
  }catch(e){
    console.log(e)
  }
}

async function authenticateCustomer(req,res,next){
  try{
    const{userID}=req.user
    const currentUser=await User.findById(userID)
    console.log(currentUser)
    const invoices = await stripe.invoices.list({customer:currentUser.customerId})
    console.log(invoices)
    if(currentUser.paymentVerified){
      next()
    }else if(invoices){
      await User.findByIdAndUpdate(userID,{$set:{paymentVerified:true}})
      next()
    }else{
      res.json({"message":"payment not verified"})
    }
  }catch(e){
    console.log(e)
  }
}

module.exports={authenticateToken,generateAccessToken,authenticateUserEmail,authenticateCustomer}