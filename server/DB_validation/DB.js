import mongoose from "mongoose";
const Connect_URL = process.env.DB_URL
export const data_base = async () =>{
    try {
        await mongoose.connect(Connect_URL)
        console.log("Data base connection successful")
    } catch (error) {
        console.log(`connection to Data base failed ?? error : ${error}`)
    }
}