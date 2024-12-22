const LikeModel = require("../model/Likes_model");

const CommentModel = require("../model/Comment_model");

const Like = async (req, res) => {
    const { pid } = req.body;
    console.log(req.body);

    try {
        if (!pid) {
            return res
                .status(400)
                .json({ message: "User ID and Post ID are required" });
        }
        const newLike = new LikeModel({
            postId: pid,
            likeUserid: req.username,
        });
        await newLike.save();
        res.status(200).json({
            message: "Post liked successfully",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const comment = async (req, res) => {
    const { cId } = req.body;
    console.log(cId);
    const { postId, commentText, IsComment } = req.body;
    console.log(postId);
    try {
        const responce = new CommentModel({
            commentUserId: req.username,
            postId: postId,
            commentText: commentText,
            IsComment: IsComment,
        });
        await responce.save();
        res.status(200).json(responce);
    } catch (error) {
        res.status(400).json({ message: "somting wrong" });
    }
};
const GetComment = async (req, res) => {
    const { pid, cflag } = req.body;
    const limit = 7;
    // const Command = await CommentModel.find({ postId: pid }).select("-__v");
    try {
        const Command = await CommentModel.aggregate([
            {
                $match: {
                    postId: pid,
                },
            },
            {
                $skip: (cflag - 1) * limit,
            },
            {
                $limit: cflag * limit,
            },
            {
                $lookup: {
                    localField: "commentUserId",
                    foreignField: "username",
                    from: "users",
                    as: "user",
                    pipeline: [
                        {
                            $project: {
                                profile: 1,
                                _id: 0,
                            },
                        },
                    ],
                },
            },
            {
                $unwind: {
                    path: "$user",
                },
            },
            {
                $addFields: {
                    profile: "$user.profile",
                },
            },
            {
                $project: {
                    __v: 0,
                    user: 0,
                },
            },
        ]);
        console.log(Command);
        res.status(200).json(Command);
    } catch (error) {
        console.log(error);
        res.status(400).jasn({message:"erroe "})
        
    }
};
module.exports = { Like, comment, GetComment };
