/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: MIT-0
 */

const AWS = require("aws-sdk");
AWS.config.update({ region: process.env.AWS_REGION });
const s3 = new AWS.S3();

const gm = require("gm");
const sizes = [480];

// 1. Load the image from S3.
// 2. Transform the image.
// 3. Save the new image in another S3 bucket.

exports.handler = async (event) => {
  // console.log(JSON.stringify(event, null, 2))
  const Key = decodeURIComponent(
    event.Records[0].s3.object.key.replace(/\+/g, " ")
  );

  // Read the object from S3
  const s3Object = await s3
    .getObject({
      Bucket: event.Records[0].s3.bucket.name,
      Key,
    })
    .promise();

  // Resize the image
  for (let index in sizes) {
    // resize
    const data = await resizeImage(s3Object.Body, sizes[index]);

    // Write to S3
    const objectKey = sizes[index] + "/" + Key;
    const result = await s3
      .putObject({
        Bucket: process.env.DESTINATION_BUCKETNAME,
        Key: objectKey,
        ContentType: "image/jpeg",
        Body: data,
      })
      .promise();
    console.log("Write result: ", result);
  }
};

// Resize - takes and returns a image buffer
const resizeImage = async (buffer, size) => {
  return new Promise((resolve, reject) => {
    gm(buffer)
      .resize(size, size)
      .toBuffer("jpg", function (err, data) {
        if (err) return reject(err);
        resolve(data);
      });
  });
};
