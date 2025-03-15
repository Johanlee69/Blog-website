import express from 'express'
import 'dotenv/config'
import { data_base } from './DB_validation/DB.js';
import cors from 'cors'
import { LogInCall, signUPCall, logoutCall, authenticateToken, refreshToken } from './controllers/auth.js';
import { Post, postView, postComment, likedUserCollection, getLikes, updatePost } from './controllers/post.js';
import multer from 'multer';
import { Comments } from './controllers/Comments.js';
import jwt from 'jsonwebtoken';
import tokenModel from './models/token.js';

const app = express()
const port = process.env.PORT
const storage = multer.diskStorage({
    destination: function(req,file,cb){
        cb(null,'uploads/')
    },
    filename: function(req,file,cb){
        cb(null,`${req.body.username}-${Math.random(Math.random()*15)}-${Date.now()}_${file.originalname}`)
    }
})
const upload = multer({ storage: storage })
app.use(cors());
app.use(express.json())
app.use('/uploads', express.static('uploads')) 
data_base();

// Function to clean up expired tokens
const cleanupExpiredTokens = async () => {
    try {
        console.log("Running token cleanup...");
        const tokens = await tokenModel.find({});
        let removedCount = 0;
        
        for (const tokenDoc of tokens) {
            try {
                
                jwt.verify(tokenDoc.token, process.env.REFRESH_SECRET_KEY);
            } catch (err) {
                await tokenModel.findByIdAndDelete(tokenDoc._id);
                removedCount++;
            }
        }
        
        console.log(`Token cleanup completed. Removed ${removedCount} invalid tokens.`);
    } catch (error) {
        console.error("Error during token cleanup:", error);
    }
};

// Run token cleanup on server start
cleanupExpiredTokens();

// Schedule token cleanup to run periodically (every 24 hours)
setInterval(cleanupExpiredTokens, 24 * 60 * 60 * 1000);

app.get('/', (req, res) => {
    res.send('server running')
})

// Public routes
app.post('/SignUP', signUPCall)
app.post('/Login', LogInCall)
app.get('/PostView', postView)
app.post('/ViewComments', Comments)
app.post('/getLikes', getLikes)
app.post('/refresh-token', refreshToken)

// Protected routes 
app.post('/logout', authenticateToken, logoutCall)
app.post('/Post', authenticateToken, upload.single('Image'), Post)
app.post('/postComment', authenticateToken, postComment)
app.post('/Liked', authenticateToken, likedUserCollection)
app.put('/updatePost', authenticateToken, upload.single('Image'), updatePost)

app.listen(port, () => {
    console.log(`Server running on port ${port}`)
})