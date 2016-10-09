/******************************************
 *  Don't use this file in production, it appears to work, but it's probably really bad!
 */
"use strict";

require("./loadConfig")("devConfig.js");
const http = require("http");
const uuid = require("node-uuid");
const aws = require("aws-sdk");

const maxSize = process.env.maxUploadSizeBytes || 204800;
const bucketName = process.env.bucketName;

const server = http.createServer((req, res) => {
    
    if (req.method != "POST") {
        res.writeHead(405);
        return res.end();
    }

    var chunks = 0;
    var bodySize = 0;
    var imgType;
    var mimeType;
    var body = [];

    req.on("data", (chunk) => {
        var data = chunk.toString('utf8');

        if (chunks == 0){
            var splitData = data.split(",",2);
            var head = splitData[0];
            data = splitData[1];

            var type = /data\:(image\/(png|jpeg))\;base64/.exec(head);

            if (!type){
                res.writeHead(415);
                return res.end("Invalid image type");
            }
            mimeType = type[1];
            imgType = (type[2] == "png") ? "png" : "jpg";
        }

        bodySize += data.length;

        if (bodySize > maxSize){
            res.writeHead(413);
            return res.end();
        }

        body.push(data);
        chunks++;
    });

    req.on("end", () => {
        if (res.finished) return;
        
        var imgData = Buffer.from(body.join(), 'base64');
        var filename = uuid.v1() + "." + imgType;

        var s3 = new aws.S3();
        s3.upload({
            ACL: "public-read",
            Bucket: bucketName,
            ContentType: mimeType,
            Key: filename,
            Body: imgData
        }, (err, data) => {
            if(err) return console.error(err);

            res.end(data.Location);
        });
    });

});

server.listen(process.env.port || 80);
