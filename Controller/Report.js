const report = (req, res) => {
    const  {Text} = req.body;
    console.log(req.body);
    res.status(200).json(Text);
}
module.exports = { report };