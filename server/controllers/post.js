import posts from "../models/post.js"
import CommentsModel from "../models/usercomments.js"
import Likes from "../models/Likes.js"
export const Post = async (req, res) => {
    try {
        const { username, Author, tittle, Description } = req.body
        let ImageSrc
        if (req.file == undefined) {
            ImageSrc = null
        }
        else {
            ImageSrc = req.file.path
        }
        const UserPost = new posts({
            username, Author, tittle, Description,
            ImageCover: ImageSrc,
        })
        await UserPost.save();

        const newLikes = new Likes({
            postID: UserPost._id,
            likedBy: []
        });
        await newLikes.save();
        
        console.log(`${username} uploaded a post`)
        res.status(201).json({ message: 'Posted' })
    } catch (error) {
        console.log(error)
        res.status(404).json({ message: 'somthing went wrong while uploading the file to the database' })
    }
}

export const postView = async (req, res) => {
    try {
        const Allposts = await posts.find()
        res.status(202).json({ posts: Allposts })
    } catch (error) {
        res.status(404).json({ message: "can't find any posts from the data base" })
        console.log(error)
    }
}

export const postComment = async (req, res) => {
    try {
        const { comments, postedby, postID } = req.body
        
        const UserPostComment = new CommentsModel({
            postedby: postedby,
            comments: comments,
            ID: postID
        })
        
        await UserPostComment.save()
        return res.status(200).json({ message: "comment posted" })
    } catch (error) {
        console.error("Error posting comment:", error)
        return res.status(404).json({ message: "failed to post comment" })
    }
}

export const likedUserCollection = async (req, res) => {
    try {
        const { postID, username } = req.body;
        
        // Validate inputs
        if (!postID || !username) {
            return res.status(400).json({ 
                message: "Missing required fields", 
                details: {
                    postID: postID ? "Valid" : "Missing",
                    username: username ? "Valid" : "Missing"
                }
            });
        }
        
        let likesDoc = await Likes.findOne({ postID: String(postID) });
        
        if (!likesDoc) {
            likesDoc = new Likes({
                postID: String(postID),
                likedBy: []
            });
        }
        
        const userIndex = likesDoc.likedBy.indexOf(username);
        
        if (userIndex === -1) {
            likesDoc.likedBy.push(username);
            await likesDoc.save();
            return res.status(200).json({
                message: "Post liked",
                liked: true,
                likeCount: likesDoc.likedBy.length
            });
        } else {
            likesDoc.likedBy.splice(userIndex, 1);
            await likesDoc.save();
            return res.status(200).json({
                message: "Like removed",
                liked: false,
                likeCount: likesDoc.likedBy.length
            });
        }
    } catch (error) {
        console.error("Error handling like:", error);
        return res.status(400).json({ message: "Failed to process like" });
    }
}

export const getLikes = async (req, res) => {
    try {
        const { postID, username } = req.body;
        
        // Validate postID
        if (!postID) {
            return res.status(400).json({ 
                message: "Missing post ID",
                likeCount: 0,
                liked: false
            });
        }
        
        const likesDoc = await Likes.findOne({ postID: String(postID) });
        
        if (!likesDoc) {
            return res.status(200).json({
                likeCount: 0,
                liked: false
            });
        }
        
        const userLiked = username ? likesDoc.likedBy.includes(username) : false;
        
        return res.status(200).json({
            likeCount: likesDoc.likedBy.length,
            liked: userLiked
        });
    } catch (error) {
        console.error("Error getting likes:", error);
        return res.status(400).json({ message: "Failed to get likes" });
    }
}

export const updatePost = async (req, res) => {
    try {
        const { postID, tittle, Author, Description } = req.body;
        
        // Get username from the authenticated token instead of request body
        const username = req.user.username;
        
        // Find the post
        const post = await posts.findById(postID);
        
        // Check if post exists
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        
        // Check if user is the author of the post
        if (post.username !== username) {
            return res.status(403).json({ message: "You can only edit your own posts" });
        }
        
        // Update post fields
        post.tittle = tittle;
        post.Author = Author;
        post.Description = Description;
        
        // Update image if provided
        if (req.file) {
            post.ImageCover = req.file.path;
        }
        
        // Save updated post
        await post.save();
        
        return res.status(200).json({ 
            message: "Post updated successfully",
            post
        });
    } catch (error) {
        console.error("Error updating post:", error);
        return res.status(500).json({ message: "Failed to update post" });
    }
}
