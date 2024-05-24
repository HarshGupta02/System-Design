import express from 'express';
import { PrismaClient } from '@prisma/client';
import bodyParser from 'body-parser';

const app = express();
const prismaClient = new PrismaClient();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.json("This is the home route");
});

app.get('/allUsers', async (req, res) => {
    const users = await prismaClient.user.findMany();
    res.status(200).json({"users": users});
});

app.post('/addUser', async (req, res) => {
    const {name, phoneNumber, email} = req.body;
    const user = await prismaClient.user.create({
        data: {
            name: name,
            phoneNumber: phoneNumber,
            email: email,
        }
    });
    res.status(200).json({"msg": `User created successfully with id ${user.id}`});
});

app.get('/allPosts', async (req, res) => {
    const posts = await prismaClient.post.findMany();
    res.status(200).json({"posts": posts});
});

app.get('/getPost', async (req, res) => {
    const userId = Number(req.query.id);
    const user = await prismaClient.user.findUnique({
        where: {id: userId},
        include: {posts: true}
    });
    console.log(user);
    if(!user) return res.status(200).json(`No posts exist for the user ${userId}`);
    const userPosts = user.posts;
    res.status(200).json({"posts": userPosts});
});

app.post('/createPost', async (req, res) => {
    let {title, content, authorId} = req.body;
    authorId = Number(authorId)
    const post = await prismaClient.post.create({
        data: {
            title: title,
            content: content,
            authorId: authorId
        }
    });
    res.status(200).json({"msg": `Post created successfully with id ${post.id} for the user ${authorId}`});
});

app.post('/transaction', async (req, res) => {
    const {name, phoneNumber, email} = req.body;
    const [addedUser, totalUsers] = await prismaClient.$transaction([
        prismaClient.user.create({ data: { name: name, phoneNumber: phoneNumber, email: email }}),
        process.exit(),
        prismaClient.user.count()
    ]);
    res.status(200).json({"response": `The user is added with id ${addedUser.id} and total users are ${totalUsers}`});
});

app.listen(8000, () => console.log('Server is listening on port 8000'));