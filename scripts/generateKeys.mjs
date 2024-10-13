import crypto from "crypto";
import fs from "fs";

const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: {
        type: "pkcs1",
        format: "pem",
    },
    privateKeyEncoding: {
        type: "pkcs1",
        format: "pem",
    },
});

console.log({ privateKey });
console.log({ publicKey });

fs.writeFileSync("certs/privateKey.pem", privateKey);
fs.writeFileSync("certs/publicKey.pem", publicKey);
