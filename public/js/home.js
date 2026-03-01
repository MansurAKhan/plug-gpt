import { initializeShell } from './shell.js?v=20';

function renderCTA(subjects) {
  const wrap = document.getElementById('home-cta');
  if (!wrap) {
    return;
  }

  const subjectList = subjects.map((s) => s.name).join(', ');
  wrap.innerHTML = `
    <a class="btn" href="/chat.html">Open Chat</a>
    <p class="muted" style="margin-top:12px;">Subjects available in chat: ${subjectList}</p>
  `;
}

(async function start() {
  const ui = await initializeShell();
  renderCTA(ui.subjects || []);
})();
