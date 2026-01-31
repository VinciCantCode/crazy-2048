// Custom modal for save score functionality
function initModal() {
  const modal = document.getElementById('save-score-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalMessage = document.getElementById('modal-message');
  const nicknameInput = document.getElementById('nickname-input');
  const cancelBtn = document.getElementById('modal-cancel');
  const saveBtn = document.getElementById('modal-save');

  let currentCallback = null;

  // Show modal function
  window.showSaveScoreModal = function(title, message, callback) {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    nicknameInput.value = '';
    currentCallback = callback;

    modal.classList.add('show');
    nicknameInput.focus();

    // Prevent game input while modal is open
    document.body.classList.add('modal-open');
  };

  // Hide modal function
  function hideModal() {
    modal.classList.remove('show');
    currentCallback = null;
    document.body.classList.remove('modal-open');
  }

  // Event listeners
  cancelBtn.addEventListener('click', function() {
    if (currentCallback) {
      currentCallback(null);
    }
    hideModal();
  });

  saveBtn.addEventListener('click', function() {
    const nickname = nicknameInput.value.trim();
    if (currentCallback) {
      currentCallback(nickname);
    }
    hideModal();
  });

  // Handle Enter key
  nicknameInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      const nickname = nicknameInput.value.trim();
      if (currentCallback) {
        currentCallback(nickname);
      }
      hideModal();
    }
  });

  // Handle Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal.classList.contains('show')) {
      if (currentCallback) {
        currentCallback(null);
      }
      hideModal();
    }
  });

  // Click outside to close
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      if (currentCallback) {
        currentCallback(null);
      }
      hideModal();
    }
  });
}

// Initialize modal when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initModal);
} else {
  initModal();
}