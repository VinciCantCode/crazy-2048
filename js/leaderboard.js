// Expose saveScore to global scope for GameManager
window.saveScore = saveScore;

document.addEventListener('DOMContentLoaded', function() {
  loadLeaderboard();
});

async function loadLeaderboard() {
  try {
    const response = await fetch('/api/leaderboard');
    if (!response.ok) throw new Error('Failed to load leaderboard');
    const scores = await response.json();
    displayLeaderboard(scores);
  } catch (error) {
    console.error('Failed to load leaderboard:', error);
    document.getElementById('leaderboard-list').innerHTML = '<p class="leaderboard-error">Failed to load leaderboard.</p>';
  }
}

async function saveScore(nickname, score) {
  try {
    const response = await fetch('/api/leaderboard', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ nickname, score })
    });
    if (response.ok) {
      loadLeaderboard(); // Refresh leaderboard after saving
    } else {
      throw new Error('Failed to save score');
    }
  } catch (error) {
    console.error('Failed to save score:', error);
    alert('Failed to save score. Please try again.');
  }
}

function displayLeaderboard(scores) {
  const container = document.getElementById('leaderboard-list');
  container.innerHTML = '';
  if (scores.length === 0) {
    container.innerHTML = '<p>No scores yet. Be the first to save!</p>';
    return;
  }
  scores.forEach((entry, index) => {
    const entryDiv = document.createElement('div');
    entryDiv.className = 'leaderboard-entry';
    entryDiv.innerHTML = `
      <span class="rank">#${index + 1}</span>
      <span class="nickname">${escapeHtml(entry.nickname)}</span>
      <span class="score">${entry.score}</span>
      <span class="timestamp">${new Date(entry.timestamp).toLocaleDateString()}</span>
    `;
    container.appendChild(entryDiv);
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}