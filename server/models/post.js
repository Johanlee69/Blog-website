import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
    username: String,
    Author: String,
    Description: String,
    tittle: String,
    ImageCover: String,
    created_at : { type : Date, default: Date.now()}
});

const posts = mongoose.model('Posts', postSchema);
export default posts;