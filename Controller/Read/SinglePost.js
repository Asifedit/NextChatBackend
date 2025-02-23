const Contain =require("../../model/Contain_model")
const ViweSinglePOst = async (req, res) => {
    console.log(req.body);
    const post = await Contain.findById(req.body.pid).select("-__v");
    console.log(post);
    res.status(200).json(post);
};
module.exports = { ViweSinglePOst };
