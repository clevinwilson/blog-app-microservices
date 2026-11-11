import { useState, useEffect } from "react";
import axios from "axios";
import CommentCreate from "./CommentCreate";
import CommentList from "./CommentList";

function PostList() {
    const [posts, setPosts] = useState({});

    const fetchPosts = async () => {
        const res = await axios.get('http://localhost:4002/post');
        setPosts(res.data);
    }

    useEffect(() => {
        fetchPosts();
    }, []);

    const renderedPosts = Object.values(posts).map(post => {
        return (
            <div className="post-card mb-4" key={post.id}>
                <div className="card-body">
                    <h5 className="card-title">{post.title}</h5>
                </div>
                <div className="comment-section comment-form">
                    <CommentList comments={post.comments} />
                    <CommentCreate postId={post.id} />
                </div>
            </div>
        )
    });

    return (
        <div>
            <h2 className="section-heading">Posts</h2>
            {renderedPosts.length === 0
                ? <div className="empty-state">No posts yet — be the first to share something.</div>
                : renderedPosts}
        </div>
    )
}

export default PostList;
