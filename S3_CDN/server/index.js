const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const {S3Client, PutObjectCommand} = require('@aws-sdk/client-s3');
const dotenv = require('dotenv');
const crypto = require('crypto');
const sharp = require('sharp');
const {PrismaClient} = require('@prisma/client');

dotenv.config();

const bucketName = process.env.BUCKET_NAME;
const bucketRegion = process.env.BUCKET_REGION;
const accessKey = process.env.ACCESS_KEY;
const secretAccessKey = process.env.SECRET_ACCESS_KEY;

const s3 = new S3Client({
    credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretAccessKey
    },
    region: bucketRegion
});

const app = express();
const prismaClient = new PrismaClient();

const newStorage = multer.memoryStorage();
const upload = multer({storage: newStorage});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : true}));

const randomImageName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

app.post('/api/posts', upload.single('image'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({height: 1920, width: 1080, fit: "contain"}).toBuffer();
    const imageName = randomImageName();
    const params = {
        Bucket: bucketName,
        Key: imageName,
        Body: buffer,
        ContentType: req.file.mimetype
    }
    const command = new PutObjectCommand(params);
    await s3.send(command);
    const post = await prismaClient.posts.create({
        data: {
            caption: req.body.caption,
            imageName: imageName
        }
    });
    res.status(200).json({"msg": `Added post successfully with id ${post.id}`});
});

app.listen(8000, () => console.log('Server is running on PORT 8000'));