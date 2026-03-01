import { initializeShell } from './shell.js?v=22';
import { ibTool } from './api.js?v=22';

function showResult(text) {
  const panel = document.getElementById('ib-result');
  const result = document.getElementById('ib-result-text');
  if (!panel || !result) {
    return;
  }
  result.textContent = text;
  panel.style.display = 'block';
}

(async function start() {
  await initializeShell();

  document.querySelectorAll('.ib-form').forEach((form) => {
    const button = form.querySelector('button[type="submit"]');
    button.dataset.label = button.textContent;

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      button.disabled = true;
      button.textContent = 'Loading...';

      const tool = form.dataset.tool;
      const topic = form.querySelector('input[name="topic"]')?.value?.trim() || '';
      const subject = form.querySelector('input[name="subject"]')?.value?.trim() || 'general';

      try {
        const data = await ibTool({ tool, topic, subject });
        showResult(data.result || 'No output');
      } catch (err) {
        showResult(`Error: ${err.message}`);
      } finally {
        button.disabled = false;
        button.textContent = button.dataset.label;
      }
    });
  });
})();
