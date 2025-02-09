import arcjet, { shield, detectBot, tokenBucket } from "@arcjet/node";

const aj = arcjet({
    key: process.env.ARCJET_KEY,
    
});

module.exports = aj;


