const LikeModel = require("../model/Likes_model");

const CommentModel = require("../model/Comment_model");
const Like = async (req, res) => {
    const { pid } = req.body;
    try {
        if (!pid) {
            return res
                .status(400)
                .json({ message: "User ID and Post ID are required" });
        }
        const newLike = await LikeModel.findOneAndUpdate(
            { postId: pid, likeUserid: req.username },
            {
                $set: { postId: pid, likeUserid: req.username },
            },
            {
                upsert: true,
            }
        );
        if (newLike.likeUserid) {
            return res.status(400).json({ message: "Alrady Like" });
        }

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
    const { postId, commentText, IsComment } = req.body;
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
        console.error(error)
        res.status(400).json({ message: "somting wrong" });
    }
};
const GetComment = async (req, res) => {
    const { pid, cflag } = req.body;
    console.error(cflag);

    const limit = 1;
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
                $limit: limit,
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
        res.status(200).json(Command);
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: "erroe " });
    }
};
module.exports = { Like, comment, GetComment };
