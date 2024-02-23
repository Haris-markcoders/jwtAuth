const dotenv=require('dotenv').config()
const express = require('express')
const app = express()
const port = 3000
const bodyParser= require('body-parser')
// import { db } from './database'
// const {connectDB}=require('./database')
const {main}=require('./config/db')
const {User}=require('./models/User')
const {generateAccessToken,authenticateToken,authenticateUserEmail}=require('./jwt')
const {sendVerificationEmail}=require('./mailer')
const bcrypt = require('bcryptjs');
const multer  = require('multer')
const stripe=require('stripe')(process.env.STRIPE_KEY)
const upload = multer({ dest: './userFiles' })

// jwt tokens set on header instead of params
    //make code authentication
// stripe integration

const storeItems=new Map([
  [1,{priceInCents:10000, name:"red"}],
  [2,{priceInCents:20000, name:"blue"}]
])

app.use(express.json())
main()

app.get('/protected', authenticateToken, (req, res) => {
    res.json({ message: 'Welcome to the protected route!'});
});

// app.post('/payment', async (req, res) => {
//   const currentUser=User.findOne({email:req.body.email})  
//   const customer=stripe.customers.create({
//     email:currentUser.email
//   })

// });


//plan of action

//customer?
//  if not a customer,create customer 
//    have customer make an order
//      this would then create a payment intent
//    make a check out route, which would then re-route the customer to the stripe payment gateway (can I verify payment here?)
//update user payment verification in database... when? where?

app.post('/order/create',authenticateToken,authenticateUserEmail,async (req,res)=>{
  try{
    const {userID}=req.user
    const currentUser=await User.findById(userID)
    if(currentUser.customerId==''){
      const customer=await stripe.customers.create({
        email:currentUser.email
      })
      await User.findOneAndUpdate({_id:currentUser._id},{$set:{customerId:customer.id}})
    }else{
      const customer=await stripe.customers.retrieve(currentUser.customerId)
    }
    // const paymentIntent=await stripe.paymentIntents.create({
    //   amount: 2000,
    //   currency: 'usd',
    //   automatic_payment_methods: {
    //     enabled: true,
    //   }
    // })
    const session = await stripe.checkout.sessions.create({
      success_url: 'https://localhost:3000/success',
      cancel_url: 'https://localhost:3000/cancel',
      line_items:req.body.items.map(item=>{
        const storeItem=storeItems.get(item.id)
        return{
          price_data:{
            currency:'usd',
            product_data:{
              name:storeItem.name
            },
            unit_amount:storeItem.priceInCents,
          },
          quantity:item.quantity
        }
      }),
      mode: 'payment',
      // payment_intent: paymentIntent.id, // Use the Payment Intent's ID
      payment_method_types: ['card'],
    });
    res.send(session.url)
  }catch(e){
    console.log(e)
  }
})

app.get('/success',(req,res)=>{
  res.json({message:"order success"})
})

app.get('/cancel',(req,res)=>{
  res.json({message:"order cancel"})
})



app.post('/verify',async (req,res)=>{
  const {username,password,code}=req.body
  const currentUser = await User.findOne({ username: username});
  console.log(currentUser)
  bcrypt.compare(password, currentUser.password, async function(err, result) {
    console.log(result)
    if(result){
      if(code==currentUser.verificationCode){
        await User.findOneAndUpdate({username:username},{$set:{verified:true}})
        res.send('email verified')
      }else{
        console.log(code)
        console.log(currentUser.verificationCode)
        res.send('verification code wrong')
      }
    }else{
      res.send('Username or password incorrect');
    }
  })
})

function usernameExists(username,array) {
    return array.some(user => user.username === username);
}
function emailExists(username,array) {
    return array.some(user => user.email === username);
}

app.get('/login',async (req,res)=>{
  const { username, password } = req.body;
  
  let verified
  // bcrypt compare encrypted pass
  const currentUser = await User.findOne({ username: username});
  
  console.log(currentUser)

  bcrypt.compare(password, currentUser.password, function(err, result) {
    if(result){
      const accessToken = generateAccessToken(currentUser._id);
      res.json({ accessToken })
    }else{
      res.send('Username or password incorrect');
    }
  })
})

app.post('/files/send',authenticateToken,authenticateUserEmail,upload.single('file'),async (req,res)=>{
  res.status(200).send('yay')
})

app.post('/signup',async (req,res)=>{
  try{
    const users=await User.find()
    if(usernameExists(req.body.username,users)||emailExists(req.body.email,users)){
      res.send('user exists')
    }else{
      let {email,username,password}=req.body
      const randomCode=Math.floor(Math.random() * (999999 - 100000) + 100000)
      // User.create({
      //       "email":email,
      //       "username":username,
      //       "password":password,
      //       "verified":false,
      //       "verificationCode":randomCode
      // })
      
      sendVerificationEmail(req.body.email,randomCode)
      bcrypt.hash(password,10, function(err, hash) {
        User.create({
          "email":email,
          "username":username,
          "password":hash,
          "verified":false,
          "verificationCode":randomCode,
          "customerId":''
        })
      });
      // const token=generateAccessToken(req.body)
      // res.json({message:`http://localhost:3000/verify/${token}`})
      res.send("Verification Email sent!")
    }
  }catch(err){
    console.log(err)
  }
})

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})