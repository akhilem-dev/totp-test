
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const path = require("path");
const fs = require("fs");
const { uploadFileToS3 } = require('./s3');
const qrFolderPath = "./qr"
async function generateAndSaveQRCode(username) {
    try {
        
        const secret = speakeasy.generateSecret({ length: 20 });
        const otpUrl  = secret.otpauth_url+`&issuer=${"Medipappel"}%20${username}`
        const qrCodeDataURL = await QRCode.toDataURL(otpUrl);

        const base64Data = qrCodeDataURL.replace(/^data:image\/png;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        const filename = `${new Date().getTime()}qrcode.png`;
        const filePath = path.join(qrFolderPath, filename);
        await uploadFileToS3(buffer,filename);
        return { secret: secret.base32,fileName:filename };
    } catch (error) {
        console.error("Error generating or saving QR code:", error);
        return null;
    }
}

async function verifyToken(secret, token) {
    try {
        const verified = speakeasy.totp.verify({
            secret: secret,
            encoding: 'base32',
            token: token,
            window: 1 // Crucial for time drift
        });
        return verified;
    } catch (error) {
        console.error("Error verifying token:", error);
        return false;
    }
}

module.exports = {
    generateAndSaveQRCode,
    verifyToken
}