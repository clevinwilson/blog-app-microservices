import React, { useState } from 'react';
import axios from 'axios';


function CommentCreate({ postId }) {
    const [content, setContent] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();
        await axios.post(`http://blogapp.com/posts/${postId}/comments`, { content });
        setContent('');
    }

    return (
        <div>
            <form onSubmit={handleSubmit}>
                <div className="form-group mb-2">
                    <label className="form-label">New Comment</label>
                    <input
                        value={content}
                        onChange={(event) => setContent(event.target.value)}
                        className="form-control"
                        placeholder="Add a comment..."
                    />
                </div>
                <button className="btn btn-primary">Reply</button>
            </form>
        </div>
    );


}

export default CommentCreate;