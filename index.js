const dotenv=require('dotenv').config()
const express = require('express')
const app = express()
const port = 3000 
const bodyParser= require('body-parser')
const {main}=require('./config/db')
const {User}=require('./api/User').default
const {Order}=require("./api/Order")
const {generateAccessToken,authenticateToken,authenticateUserEmail,authenticateCustomer}=require('./api/jwt')
const {sendVerificationEmail}=require('./api/mailer')
const bcrypt = require('bcryptjs');
// const multer  = require('multer')
const stripe=require('stripe')(process.env.STRIPE_KEY)
// const upload = multer({ dest: './userFiles' })
console.log('running server.js')

app.use(express.json())
main()

app.post('/api/orders/create', async (req,res)=>{
    const order = new Order({
        store_id: req.body.app_id,
        po: req.body.name,
        order_detail: req.body
    })
    await order.save()
    res.json(req.body)
})

//make a subscription product
//  implement timings with firebase and google calender

//the issue with customer initialisation on signup is that I'll have to change how the buying works

app.post('/order/create',authenticateToken,authenticateUserEmail,async (req,res)=>{
  try{


    const session = await stripe.checkout.sessions.create({
      success_url: 'https://localhost:3000/success',
      cancel_url: 'https://localhost:3000/cancel',
      line_items:req.body.items,
      mode: 'payment',
      payment_method_types: ['card'],
    });
    res.send(session.url)
  }catch(e){
    console.log(e)
  }
})

app.post('/signup', async (req, res) => {
  try {
    const users = await User.find();

    function usernameExists(username, array) {
      return array.some((user) => user.username === username);
    }
    function emailExists(email, array) {
      return array.some((user) => user.email === email);
    }
    const { email, username, password } = req.body;
    if (usernameExists(username, users) || emailExists(email, users)) {
      return res.send('User already exists');
    }
    const randomCode = Math.floor(Math.random() * (999999 - 100000) + 100000);
    await sendVerificationEmail(email, randomCode);
    const customer = await stripe.customers.create({
      email: email,
    });
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Creating user');
    await User.create({
      email: email,
      username: username,
      password: hashedPassword,
      verified: false,
      verificationCode: randomCode,
      customerId: customer.id,
    });
    res.send('Verification Email sent!');
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/protected', authenticateToken, (req, res) => {
  try{
    res.json({ message: 'Welcome to the protected route!'});
  }catch(e){
    console.log(e)
  }
});


app.get('/success',(req,res)=>{
  res.json({"message":"order success"})
})

app.get('/cancel',(req,res)=>{
  res.json({message:"order cancel"})
})



app.post('/verify',async (req,res)=>{
  try{
    const {username,password,code}=req.body
    const currentUser = await User.findOne({ username: username});
    if(!currentUser)return res.send('user not found')
    if(currentUser.verified)return res.send('user already verified')
    bcrypt.compare(password, currentUser.password, async function(err, result) {
    if(!result) return res.send('password incorrect')
      if(code==currentUser.verificationCode){
        await User.findOneAndUpdate({username:username},{$set:{verified:true}})
        res.send('email verified')
      }else{
        res.send('verification code wrong')
      }
    })
  }catch(e){
    console.log(e)
  }
})

app.post('/login',async (req,res)=>{
  try{
    const { username, password } = req.body;
    let verified
    const currentUser = await User.findOne({ username: username});
    if(!currentUser) return res.send('user not found')
    bcrypt.compare(password, currentUser.password, function(err, result) {
      if(!result) return res.send('password incorrect');
      const accessToken = generateAccessToken(currentUser._id);
      res.json({ accessToken })
    })
  }catch(e){
    console.log(e)
  }
})

// app.post('/files/send',authenticateToken,authenticateUserEmail,authenticateCustomer,upload.single('file'),async (req,res)=>{
//   res.status(200).send('yay')
// })

app.get('/', async (req, res) => {
  res.send('Hello World!')
})

app.listen(process.env.PORT||port, () => {
  console.log(`Example app listening on port ${port}`)
})