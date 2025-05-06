const Option = {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
    path: "/",
    domain: "nextchatfrontend.pages.dev",
};

const logout = (req, res) => {
    return res
        .status(200)
        .clearCookie("AccessToken", Option)
        .clearCookie("RefreshToken", Option)
        .json({ message: "User logged out successfully" });
};

module.exports = logout;
