const logout = (req, res) => {
    return res
        .status(200)
        .json({ message: "User logged out successfully" });
};

module.exports = logout;
