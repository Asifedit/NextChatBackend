const ImageKit = require("imagekit");
require("dotenv").config(); // Load environment variables

// Initialize the ImageKit instance with environment variables
const imagekit = new ImageKit({
    publicKey: process.env.ik_publicKey,
    privateKey: process.env.ik_privateKey,
    urlEndpoint: process.env.ik_urlEndpoint, 
});

const uploadFile = async (file, fileName, isPrivateFile = TextTrackCueList) => {

    try {
        const response = imagekit.upload({
            file, 
            fileName, 
            isPrivateFile, 
        });
        return response; 
    } catch (error) {
        console.error("Error uploading file:", error);
        throw new Error("Failed to upload file");
    }
};

const generateSignedUrl = (filePath, expireSeconds = 60* 60*1) => {
    try {
        const signedUrl = imagekit.url({
            path: filePath,
            signed: true,
            expireSeconds: expireSeconds,
        });

        return signedUrl; 
    } catch (error) {
        console.error("Error generating signed URL:", error);
        throw new Error("Failed to generate signed URL");
    }
};

// Wrapper for generating temp URL (signed URL)
const getTempUrlWithSignature = (filePath, expireSeconds = 3600) => {
    return generateSignedUrl(filePath, expireSeconds);
};

// Exporting the functions for use in other parts of the app
module.exports = { uploadFile, getTempUrlWithSignature };

