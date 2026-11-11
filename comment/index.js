import express from 'express';
import { randomUUID } from 'crypto';
import cors from 'cors';
import axios from 'axios';

const app = express();

app.use(cors("*"));
app.use(express.json());

const commentsByPostId = {};

app.get('/posts/:id/comments', (req, res) => {
    res.send(commentsByPostId[req.params.id] || []);
});

app.post('/posts/:id/comments', async (req, res) => {
    const commentId = randomUUID();
    const { content } = req.body;

    const comments = commentsByPostId[req.params.id] || [];
    comments.push({ id: commentId, content, status: 'pending' });
    commentsByPostId[req.params.id] = comments;

    axios.post('http://localhost:4005/events', {
        type: 'CommentCreated',
        data: { id: commentId, content, postId: req.params.id, status: 'pending' }
    }).catch(err => {
        console.error('Error sending event to event bus:', err);
    });

    res.status(201).send(comments);
})

app.post('/events', async (req, res) => {
    console.log('Event Received', req.body.type);

    const { type, data } = req.body;

    if (type === 'CommentModerated') {
        const { postId, id, status, content } = data;
        const comments = commentsByPostId[postId];
        const comment = comments.find(comment => comment.id === id);
        comment.status = status;

        await axios.post('http://localhost:4005/events', {
            type: 'CommentUpdated',
            data: { id, postId, status, content }
        }).catch(err => {
            console.error('Error sending event to event bus:', err);
        });
    }

    res.send({});
});

app.listen(4001, () => {
    console.log('Server is running on port 4001');
});