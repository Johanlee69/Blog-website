import mongoose from 'mongoose';

const user_Schema = new mongoose.Schema({
    Name : String,
    username : String,
    password : String
});
const user = mongoose.model("Users",user_Schema);

export default user;