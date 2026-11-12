import express from 'express';
import axios from 'axios';

const app = express();
app.use(express.json());

const events = [];

app.post('/events', async (req, res) => {
    const event = req.body;

    events.push(event);

    console.log('Event Received', event.type);

    await axios.post('http://posts-clusterip-srv:4000/events', event).catch(err => {
        console.log('Error sending event to posts service:', err.message);
    });
    await axios.post('http://comments-srv:4001/events', event).catch(err => {
        console.log('Error sending event to comments service:', err.message);
    });
    await axios.post('http://querys-srv:4002/events', event).catch(err => {
        console.log('Error sending event to query service:', err.message);
    });
    await axios.post('http://moderations-srv:4003/events', event).catch(err => {
        console.log('Error sending event to moderation service:', err.message);
    });

    res.send({ status: 'OK' });
})

app.get('/events', (req, res) => {
    res.send(events);
});

app.listen(4005, () => {
    console.log('Event Bus listening on 4005');
});