import mongoose from "mongoose";

const LikesSchema = new mongoose.Schema({
    postID: {
        type: String,
        required: true,
        unique: true
    },
    likedBy: {
        type: [String],
        default: []
    }
});

const Likes = mongoose.model('Likes', LikesSchema);
export default Likes;