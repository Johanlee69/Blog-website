import user from "../models/model.js";
import bcryptjs from 'bcryptjs'
import jwt from "jsonwebtoken";
import token from "../models/token.js";
import 'dotenv/config'

export const signUPCall = async (req, res) => {
    const { Name, username, password } = req.body
    const checkUserName = await user.findOne({ username });
    if (checkUserName) return res.status(400).json({message : `${username} already exist`})
    const salt = await bcryptjs.genSalt(5);
    const hashedpassword = await bcryptjs.hash(password, salt);
    const newUser = new user({
        Name,
        username,
        password: hashedpassword
    })
    await newUser.save();
    const successful = "user added to the database"
    console.log(successful)
    res.send(successful)
}

export const LogInCall = async (req, res) => {
    const { username, password } = req.body
    const findUSer = await user.findOne({ username })
    if (!findUSer) return res.status(401).json({ message: "Invalid user" })
    try {
        const match = await bcryptjs.compare(password, findUSer.password)
        if (!match) return res.status(401).json({ message: "Invalid password" })
        const Token = jwt.sign(findUSer.toJSON(), process.env.SCERET_KEY, { expiresIn: '15m' });
        const RefreshToken = jwt.sign(findUSer.toJSON(), process.env.REFRESH_SECRET_KEY);
 
        try {
            const oldTokens = await token.find({});
            for (const oldToken of oldTokens) {
                try {
                    const decoded = jwt.verify(oldToken.token, process.env.REFRESH_SECRET_KEY);
                    if (decoded._id === findUSer._id.toString()) {
                        await token.findByIdAndDelete(oldToken._id);
                    }
                } catch (err) {
                    await token.findByIdAndDelete(oldToken._id);
                }
            }
        } catch (cleanupErr) {
            console.error("Error cleaning up old tokens:", cleanupErr);
        }
        
        // Save refresh token to database
        const newtoken = new token({ token: RefreshToken })
        await newtoken.save();
        
        res.status(200).json({ 
            accessToken: Token, 
            refreshToken: RefreshToken,
            Name: findUSer.Name, 
            username: findUSer.username,
            isAdmin: findUSer.isAdmin || false
        })
        
        console.log(`${findUSer.Name} logged in`)
    }
    catch (err) {
        console.error("Login error:", err);
        return res.status(400).json({ message: "Connection problem! Please try again." })
    }
}

export const logoutCall = async (req, res) => {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ message: "No refresh token provided" });
    }
  
    try {
      const tokenRecord = await token.findOneAndDelete({ token: refreshToken });
      
      if (!tokenRecord) {
        return res.status(400).json({ message: "Refresh token not found" });
      }
  
      console.log(`${req.body.username} logged out`);
      res.status(200).json({ message: "Logged out successfully" });
    } catch (err) {
      console.log("Error logging out:", err);
      return res.status(500).json({ message: "Error during logout" });
    }
  };

// Authentication middleware
export const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const tokenString = authHeader && authHeader.split(' ')[1];
        
        if (!tokenString) {
            return res.status(401).json({ message: "Access token is required" });
        }
        
        jwt.verify(tokenString, process.env.SCERET_KEY, (err, decoded) => {
            if (err) {
                return res.status(403).json({ message: "Invalid or expired token" });
            }
            req.user = decoded;
            next();
        });
    } catch (error) {
        console.error("Authentication error:", error);
        return res.status(500).json({ message: "Authentication failed" });
    }
}
export const refreshToken = async (req, res) => {
    const { refreshToken: refreshTokenFromClient } = req.body;
    
    if (!refreshTokenFromClient) {
        return res.status(401).json({ message: "Refresh token is required" });
    }
    
    try {
        
        const tokenRecord = await token.findOne({ token: refreshTokenFromClient });
        
        if (!tokenRecord) {
            console.log("Refresh token not found in database");
            return res.status(403).json({ message: "Invalid refresh token" });
        }
        
        // Verify the refresh token
        jwt.verify(refreshTokenFromClient, process.env.REFRESH_SECRET_KEY, async (err, decoded) => {
            if (err) {
                console.log("Refresh token verification failed:", err.message);
                
                // Remove invalid token from database
                await token.findOneAndDelete({ token: refreshTokenFromClient });
                
                return res.status(403).json({ message: "Invalid or expired refresh token" });
            }
            
            try {
                // Find the user
                const userData = await user.findOne({ _id: decoded._id });
                
                if (!userData) {
                    console.log("User not found for token:", decoded._id);
                    return res.status(404).json({ message: "User not found" });
                }
                
                // Generate a new access token
                const newAccessToken = jwt.sign(userData.toJSON(), process.env.SCERET_KEY, { expiresIn: '15m' });
                
                // Send the new access token
                res.status(200).json({ 
                    accessToken: newAccessToken,
                    message: "Token refreshed successfully"
                });
            } catch (userError) {
                console.error("Error finding user:", userError);
                return res.status(500).json({ message: "Error processing token refresh" });
            }
        });
    } catch (error) {
        console.error("Token refresh error:", error);
        return res.status(500).json({ message: "Error refreshing token" });
    }
};