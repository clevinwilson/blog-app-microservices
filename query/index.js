import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();

app.use(cors("*"));
app.use(express.json());

const posts = {};

const handleEvents = (type, data) => {
    if (type === 'PostCreated') {
        const { id, title } = data;
        posts[id] = { id, title, comments: [] };
    }

    if (type === 'CommentCreated') {
        const { id, content, postId, status } = data;
        const post = posts[postId];
        post.comments.push({ id, content, status });
    }

    if(type === 'CommentUpdated') {
        const { id, content, postId, status } = data;
        const post = posts[postId];
        const comment = post.comments.find(comment => comment.id === id);
        comment.status = status;
        comment.content = content;
    }
};

app.get('/post', (req, res) => {
    res.send(posts);
});

app.post('/events', (req, res) => {
    const { type, data } = req.body;

    console.log('Event received in event service:', type);

    handleEvents(type, data);
    

    res.send({ status: 'OK' });
});

app.listen(4002, async () => {
    console.log("Query service is listening on port 4002");

    const res = await axios.get('http://event-bus-srv:4005/events');

    for (let event of res.data) {
        console.log('Processing event:', event.type);
        handleEvents(event.type, event.data);
    };
})