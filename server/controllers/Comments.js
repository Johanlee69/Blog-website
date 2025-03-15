import comments from "../models/usercomments.js"

export const Comments = async (req,res)=>{
    try {
        const { ID }  = req.body
        const AvailableComments = await comments.find({
            ID : ID
        }) 
        if(!AvailableComments || AvailableComments.length === 0){ return res.status(201).json({message:"can't find available comments", comments : []})}
        return res.status(200).json({message : "comments collected", comments : AvailableComments})
    } catch (error) {
        console.log(error)
        return res.status(400).json({message:"failed fetch comments"})

    }
}