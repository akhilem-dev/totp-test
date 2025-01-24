const { S3Client } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const fs = require('fs');
const path = require('path');

// Configure the S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION, // Replace with your AWS region (e.g., 'us-east-1')
  // If you are NOT using IAM roles, uncomment the following and replace with your credentials.
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

async function uploadFileToS3(fileStream,filename) {
  try {

    const uploadParams = {
      Bucket:process.env.AWS_BUCKET_NAME,
      Key:`qrcodes/${filename}`,
      Body: fileStream,
    };

    const upload = new Upload({
      client: s3Client,
      params: uploadParams,
      partSize: 10 * 1024 * 1024, // 10 MB. Adjust as needed.
      queueSize: 4, // Concurrent uploads
    });

    upload.on('httpUploadProgress', (progress) => {
      console.log('Upload Progress:', progress);
    });

    await upload.done();
    return true;
  } catch (err) {
    console.error('Error uploading file:', err);
    return false;
  }
}
module.exports = {
    uploadFileToS3
}

