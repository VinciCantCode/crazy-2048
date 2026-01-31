document.addEventListener('DOMContentLoaded', function() {
  loadComments();

  const form = document.getElementById('comment-form');
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    const nickname = document.getElementById('nickname').value.trim();
    const message = document.getElementById('message').value.trim();
    if (nickname && message) {
      postComment(nickname, message)
        .then(() => {
          document.getElementById('nickname').value = '';
          document.getElementById('message').value = '';
          loadComments();
        })
        .catch((err) => {
          console.error('Failed to post comment:', err);
          alert('Failed to post comment. Please try again.');
        });
    }
  });

  // Toggle comments functionality
  const toggleBtn = document.getElementById('toggle-comments');
  const commentsList = document.getElementById('comments-list');

  toggleBtn.addEventListener('click', function() {
    const isCollapsed = commentsList.classList.contains('collapsed');
    if (isCollapsed) {
      commentsList.classList.remove('collapsed');
      toggleBtn.textContent = 'Hide Comments';
    } else {
      commentsList.classList.add('collapsed');
      toggleBtn.textContent = 'Show Comments';
    }
  });
});

async function loadComments() {
  try {
    const response = await fetch('/api/comments');
    if (!response.ok) throw new Error('Failed to load comments');
    const comments = await response.json();
    displayComments(comments);
  } catch (error) {
    console.error('Failed to load comments:', error);
    document.getElementById('comments-list').innerHTML = '<p class="comments-error">Failed to load comments.</p>';
  }
}

async function postComment(nickname, message) {
  try {
    const response = await fetch('/api/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ nickname, message })
    });
    if (!response.ok) {
      throw new Error('Failed to post comment');
    }
  } catch (error) {
    console.error('Failed to post comment:', error);
    throw error;
  }
}

function displayComments(comments) {
  const container = document.getElementById('comments-list');
  container.innerHTML = '';
  comments.forEach(comment => {
    const commentDiv = document.createElement('div');
    commentDiv.className = 'comment';
    commentDiv.innerHTML = `
      <div class="comment-header">
        <strong>${escapeHtml(comment.nickname)}</strong>
        <span class="timestamp">${new Date(comment.timestamp).toLocaleString()}</span>
      </div>
      <div class="comment-message">${escapeHtml(comment.message)}</div>
    `;
    container.appendChild(commentDiv);
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}