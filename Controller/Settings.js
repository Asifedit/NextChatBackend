const User = require("../model/user_model");

const myprofile = async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                username: req.username,
            },
        },
        {
            $lookup: {
                localField: "username",
                foreignField: "username",
                from: "userconfigs",
                as: "result",
            },
        },
        {
            $unwind: {
                path: "$result",
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $project: {
                username: 1,
                _id: 1,
                userAbout: 1,
                bio: 1,
                BirthDay: 1,
                EnablePinAuth: {
                    $cond: {
                        if: {
                            $gt: [
                                {
                                    $strLenCP: {
                                        $ifNull: [
                                            "$result.Two_Step_Verification_Coad",
                                            "",
                                        ],
                                    },
                                },
                                0,
                            ],
                        },
                        then: true,
                        else: false,
                    },
                },
                EnableTwoFaAppAuth: {
                    $cond: {
                        if: {
                            $and: [
                                {
                                    $gt: [
                                        {
                                            $strLenCP: {
                                                $ifNull: [
                                                    "$result.TwoFa_App_Token",
                                                    "",
                                                ],
                                            },
                                        },
                                        0,
                                    ],
                                },
                            ],
                        },
                        then: true,
                        else: false,
                    },
                },
                EnablePassKey: {
                    $cond: {
                        if: {
                            $and: [
                                {
                                    $gt: [
                                        {
                                            $strLenCP: {
                                                $ifNull: [
                                                    "$result.PassKey_Token",
                                                    "",
                                                ],
                                            },
                                        },
                                        0,
                                    ],
                                },
                            ],
                        },
                        then: true,
                        else: false,
                    },
                },
            },
        },
    ]);    
    res.status(200).json({ data: user[0] });
};

module.exports = myprofile;