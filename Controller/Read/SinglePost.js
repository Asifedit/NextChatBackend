const Contain =require("../../model/Contain_model")
const ViweSinglePOst = async (req, res) => {
    const post = await Contain.findById(req.body.pid).select("-__v");
    res.status(200).json(post);
};
module.exports = { ViweSinglePOst };
