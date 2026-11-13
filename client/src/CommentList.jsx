function CommentList({ comments }) {
    return (
        <ul className="list-group">
            {comments.map(comment => {
                let content;

                if(comment.status === 'pending') {
                    content = 'This comment is awaiting moderation';
                } 

                if(comment.status === 'rejected') {
                    content = 'This comment has been rejected';
                }

                if(comment.status === 'approved') {
                    content = comment.content;
                }

                return (
                     <li className="list-group-item" key={comment.id}>
                    {content}
                </li>
                )
            }
            )}
        </ul>
    );
}

export default CommentList;