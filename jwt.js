const jwt = require('jsonwebtoken');
const {User}=require('./models/User')

function generateAccessToken(user) {
    const payload = {
      userID:user._id
    };
    
    const secret = 'your-secret-key';
    const options = { expiresIn: '1h' };
  
    return jwt.sign(payload, secret, options);
}

function verifyAccessToken(token) {
    const secret = 'your-secret-key';
    try {
      const decoded = jwt.verify(token, secret);
      return { success: true, data: decoded };
    } catch (error) {
      return { success: false, error: error.message };
    }
}

function authenticateToken(req, res, next) {
    // console.log(req.headers['authorization'])
    // const token=req.params.token
    const token = req.headers['authorization'];
    // const token = authHeader && authHeader.split(' ')[1];
  
    if (!token) {
      return res.sendStatus(401);
    }
    const result = verifyAccessToken(token);


    if (!result.success) {
      return res.status(403).json({ error: result.error });
    }
  
    req.user = result.data;
    // console.log(result.data)
    next();
}

async function authenticateUserEmail(req,res,next){
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
}

module.exports={authenticateToken,generateAccessToken,authenticateUserEmail}