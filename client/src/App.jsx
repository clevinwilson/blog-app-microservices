import PostCreate from "./PostCreate"
import PostList from "./PostList"

function App() {


  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="eyebrow">Welcome</span>
        <h1>Blog App</h1>
        <p>Share your thoughts and join the conversation</p>
      </header>
      <PostCreate />
      <hr className="section-divider" />
      <PostList/>
    </div>
  )
}

export default App
