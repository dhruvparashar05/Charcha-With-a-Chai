// Charcha With a Chai - App Logic

// DOM Elements
const landingView = document.getElementById('landing-view');
const chatView = document.getElementById('chat-view');
const btnCalmMentor = document.getElementById('btn-calm-mentor');
const btnWittyEngineer = document.getElementById('btn-witty-engineer');
const btnBackToTapri = document.getElementById('btn-back-to-tapri');

const activeMentorAvatar = document.getElementById('active-mentor-avatar');
const activeMentorName = document.getElementById('active-mentor-name');
const chatMessagesContainer = document.getElementById('chat-messages-container');
const chatTypingIndicator = document.getElementById('chat-typing-indicator');
const chatForm = document.getElementById('chat-form');
const chatTextarea = document.getElementById('chat-textarea');
const btnSendMessage = document.getElementById('btn-send-message');

// Mentor Configuration
const MENTORS = {
  'calm-mentor': {
    name: 'Hitesh Choudhary',
    avatar: 'images/calm_mentor.jpg',
    welcomeMsg: 'Haan ji! Aao, baitho. ☕ Chai ready hai. Aaj kis topic ya bug ke baare mein charcha karni hai? Tension bilkul mat lena, aaram se code seekhenge.'
  },
  'witty-engineer': {
    name: 'Piyush Garg',
    avatar: 'images/funny_engineer.jpg',
    welcomeMsg: 'Finally, koi toh aaya tapri pe! Haal-chaal badhiya? Suno, direct solution mat maangna, thoda roast karenge, fir sahi logic samjhayenge. Batao, kya error aayi hai aaj?'
  }
};

// Application State
let activeMentorId = null;
let conversationHistory = []; // Stores the messages for the active session

// Init listeners
function init() {
  // Card click triggers Start Charcha
  btnCalmMentor.addEventListener('click', () => startCharcha('calm-mentor'));
  btnWittyEngineer.addEventListener('click', () => startCharcha('witty-engineer'));
  
  // Back to landing page
  btnBackToTapri.addEventListener('click', backToTapri);

  // Auto-resize input textarea
  chatTextarea.addEventListener('input', adjustTextareaHeight);

  // Textarea key listener (Enter to send, Shift+Enter for newline)
  chatTextarea.addEventListener('keydown', handleTextareaKeydown);

  // Form submit handler
  chatForm.addEventListener('submit', handleFormSubmit);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Transition to Chat Screen
function startCharcha(mentorId) {
  activeMentorId = mentorId;
  const mentor = MENTORS[mentorId];

  // Set header details
  activeMentorName.textContent = mentor.name;
  activeMentorAvatar.src = mentor.avatar;
  activeMentorAvatar.alt = `${mentor.name} Avatar`;

  // Reset conversation history & container
  conversationHistory = [];
  chatMessagesContainer.innerHTML = '';

  // Switch views
  landingView.classList.remove('active');
  chatView.classList.add('active');

  // Inject initial mentor welcome message
  injectMessage('assistant', mentor.welcomeMsg);
  
  // Focus the input
  chatTextarea.focus();
}

// Transition back to Landing Screen
function backToTapri() {
  activeMentorId = null;
  conversationHistory = [];
  chatMessagesContainer.innerHTML = '';
  
  chatView.classList.remove('active');
  landingView.classList.add('active');
}

// Adjust Textarea Height automatically based on contents
function adjustTextareaHeight() {
  chatTextarea.style.height = 'auto';
  chatTextarea.style.height = `${chatTextarea.scrollHeight}px`;
}

// Handle Keydown in Input field
function handleTextareaKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    chatForm.dispatchEvent(new Event('submit', { cancelable: true }));
  }
}

// Form Submission
async function handleFormSubmit(e) {
  e.preventDefault();
  
  const text = chatTextarea.value.trim();
  if (!text) return;

  // Append user message to history and view
  injectMessage('user', text);
  
  // Clear and reset textarea
  chatTextarea.value = '';
  adjustTextareaHeight();
  
  // Disable form input
  setFormDisabledState(true);

  // Show typing indicator
  showTypingIndicator(true);

  try {
    // Send history to backend endpoint
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        mentorId: activeMentorId,
        messages: conversationHistory
      })
    });

    if (!response.ok) {
      throw new Error(`Server returned error status ${response.status}`);
    }

    const data = await response.json();
    
    // Hide typing indicator
    showTypingIndicator(false);
    
    // Inject assistant reply
    injectMessage('assistant', data.content);

  } catch (error) {
    console.error('Chat error:', error);
    showTypingIndicator(false);
    
    // Inject error message
    injectMessage('assistant', '⚠️ *Tapri closed temporarily!* Lagta hai network mein koi issue hai ya API key sahi nahi hai. Ek baar check karke reload karo.');
  } finally {
    // Enable form input
    setFormDisabledState(false);
    chatTextarea.focus();
  }
}

// Inject a message bubble into the DOM and push to session history
function injectMessage(role, content) {
  // Push to history array (without system prompts or UI specific content)
  conversationHistory.push({ role, content });

  const wrapper = document.createElement('div');
  wrapper.className = `message-wrapper ${role}`;

  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';
  bubble.innerHTML = parseMarkdown(content);

  wrapper.appendChild(bubble);
  chatMessagesContainer.appendChild(wrapper);

  // Autoscroll to bottom
  scrollToBottom();
}

// Toggle disable state for textarea and send button
function setFormDisabledState(disabled) {
  chatTextarea.disabled = disabled;
  btnSendMessage.disabled = disabled;
}

// Toggle showing typing dot indicator
function showTypingIndicator(show) {
  if (show) {
    chatTypingIndicator.style.display = 'flex';
  } else {
    chatTypingIndicator.style.display = 'none';
  }
  scrollToBottom();
}

// Scroll chat container to bottom
function scrollToBottom() {
  chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
}

// Helper to parse basic markdown elements (code, paragraphs) securely
function parseMarkdown(text) {
  // 1. Escape HTML entities to prevent HTML injection/XSS
  let escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 2. Parse fenced code blocks with markdown format: ```lang ... ```
  escaped = escaped.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
    const languageClass = lang ? ` class="language-${lang}"` : '';
    return `<pre><code${languageClass}>${code.trim()}</code></pre>`;
  });

  // 3. Parse inline code block format: `code`
  escaped = escaped.replace(/`([^`]+)`/g, '<code>$1</code>');

  // 4. Parse bold markdown format: **text**
  escaped = escaped.replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1</strong>');

  // 5. Parse italic markdown format: *text*
  escaped = escaped.replace(/\*([\s\S]+?)\*/g, '<em>$1</em>');

  // 6. Split text into paragraphs and replace remaining newlines with line breaks
  const paragraphs = escaped.split(/\n\n+/);
  return paragraphs
    .map(para => {
      const trimmed = para.trim();
      if (!trimmed) return '';
      // If it contains a code block, do not wrap in paragraph
      if (trimmed.startsWith('<pre>')) {
        return trimmed;
      }
      return `<p>${trimmed.replace(/\n/g, '<br>')}</p>`;
    })
    .join('');
}
