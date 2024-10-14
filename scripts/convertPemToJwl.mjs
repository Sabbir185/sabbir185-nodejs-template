import fs from "fs";
import path from "path";
import rsaPemToJwk from "rsa-pem-to-jwk";

const privateKey = fs.readFileSync(path.resolve("certs/privateKey.pem"));

const jwk = rsaPemToJwk(privateKey, { use: "sig" }, "public");

console.log(JSON.stringify(jwk));
