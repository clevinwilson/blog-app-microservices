import { useState } from 'react';
import axios from 'axios';


function PostCreate() {
    const [title, setTitle] = useState('');

   const onSubmit = async (event) => {
        event.preventDefault();
        await axios.post('http://localhost:4000/post', {
            title
        });
        setTitle('');

    }
    return (
        <div className="glass-card">
            <div className="card-body">
                <h5 className="card-title mb-3">✍️ Create Post</h5>

                <form onSubmit={onSubmit}>
                    <div className="mb-3">
                        <label className="form-label">Enter your post</label>
                        <input
                            className="form-control"
                            placeholder="What's on your mind?"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>
                    <button className="btn btn-primary">Publish</button>
                </form>
            </div>
        </div>
    )
}

export default PostCreate;