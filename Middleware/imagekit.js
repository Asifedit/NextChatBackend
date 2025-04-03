const ImageKit = require("imagekit");
require("dotenv").config(); // Load environment variables
const fs = require("fs")
// Initialize the ImageKit instance with environment variables
const imagekit = new ImageKit({
    publicKey: process.env.ik_publicKey,
    privateKey: process.env.ik_privateKey,
    urlEndpoint: process.env.ik_urlEndpoint, 
});

const uploadFile = async (file, fileName, isPrivateFile = false) => {

    try {
        const response = await imagekit.upload({
            file: fs.readFileSync(file),
            fileName,
            isPrivateFile,
            useUniqueFileName: true,
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


module.exports = { uploadFile, getTempUrlWithSignature };

