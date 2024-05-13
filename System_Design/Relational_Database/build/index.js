"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const body_parser_1 = __importDefault(require("body-parser"));
const app = (0, express_1.default)();
const prismaClient = new client_1.PrismaClient();
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.get('/', (req, res) => {
    res.json("This is the home route");
});
app.get('/allUsers', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const users = yield prismaClient.user.findMany();
    res.status(200).json({ "users": users });
}));
app.post('/addUser', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, phoneNumber, email } = req.body;
    const user = yield prismaClient.user.create({
        data: {
            name: name,
            phoneNumber: phoneNumber,
            email: email,
        }
    });
    res.status(200).json({ "msg": `User created successfully with id ${user.id}` });
}));
app.get('/allPosts', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const posts = yield prismaClient.post.findMany();
    res.status(200).json({ "posts": posts });
}));
app.get('/getPost', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = Number(req.query.id);
    const user = yield prismaClient.user.findUnique({
        where: { id: userId },
        include: { posts: true }
    });
    console.log(user);
    if (!user)
        return res.status(200).json(`No posts exist for the user ${userId}`);
    const userPosts = user.posts;
    res.status(200).json({ "posts": userPosts });
}));
app.post('/createPost', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let { title, content, authorId } = req.body;
    authorId = Number(authorId);
    const post = yield prismaClient.post.create({
        data: {
            title: title,
            content: content,
            authorId: authorId
        }
    });
    res.status(200).json({ "msg": `Post created successfully with id ${post.id} for the user ${authorId}` });
}));
app.post('/transaction', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, phoneNumber, email } = req.body;
    const [addedUser, totalUsers] = yield prismaClient.$transaction([
        prismaClient.user.create({ data: { name: name, phoneNumber: phoneNumber, email: email } }),
        process.exit(),
        prismaClient.user.count()
    ]);
    res.status(200).json({ "response": `The user is added with id ${addedUser.id} and total users are ${totalUsers}` });
}));
app.listen(8000, () => console.log('Server is listening on port 8000'));
