import mongoose from "mongoose";

const userCommentSChema = new mongoose.Schema({
    postedby: String,
    comments: String,
    ID : String,
})

const comments = mongoose.model('userComments',userCommentSChema)
export default comments;