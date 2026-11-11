import express from "express";
import { randomUUID } from "crypto";
import cors from "cors";
import axios from "axios";

const app = express();

app.use(cors("*"));
app.use(express.json());

const posts = {}

app.get("/post", (req, res) => {
    res.status(200).json(posts);
})

app.post("/post", async (req, res) => {
    const id = randomUUID();
    const { title } = req.body;
    posts[id] = { id, title };

    console.log("Post Created", { id, title });

    axios.post("http://localhost:4005/events", {
        type: "PostCreated",
        data: { id, title }
    });
    
    res.status(201).json({ id, title });
});

app.post("/events", (req, res) => {
    console.log("Event Received", req.body.type);
    res.send({});
})

app.listen(4000, () => {
    console.log("Server is running on port 4000");
});