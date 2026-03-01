import { initializeShell } from './shell.js?v=20';
import { rewrite, grammarFix, essayBuilder } from './api.js?v=20';

function showResult(text) {
  const panel = document.getElementById('writing-result');
  const result = document.getElementById('writing-result-text');
  if (!panel || !result) {
    return;
  }
  result.textContent = text;
  panel.style.display = 'block';
}

function setLoading(button, loading) {
  button.disabled = loading;
  button.textContent = loading ? 'Loading...' : button.dataset.label;
}

(async function start() {
  await initializeShell();

  const rewriteForm = document.getElementById('rewrite-form');
  const grammarForm = document.getElementById('grammar-form');
  const essayForm = document.getElementById('essay-form');

  if (rewriteForm) {
    const button = rewriteForm.querySelector('button[type="submit"]');
    button.dataset.label = button.textContent;
    rewriteForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      setLoading(button, true);
      try {
        const data = await rewrite({
          text: rewriteForm.text.value.trim(),
          style: rewriteForm.style.value
        });
        showResult(data.result || 'No output');
      } catch (err) {
        showResult(`Error: ${err.message}`);
      } finally {
        setLoading(button, false);
      }
    });
  }

  if (grammarForm) {
    const button = grammarForm.querySelector('button[type="submit"]');
    button.dataset.label = button.textContent;
    grammarForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      setLoading(button, true);
      try {
        const data = await grammarFix({ text: grammarForm.text.value.trim() });
        showResult(data.result || 'No output');
      } catch (err) {
        showResult(`Error: ${err.message}`);
      } finally {
        setLoading(button, false);
      }
    });
  }

  if (essayForm) {
    const button = essayForm.querySelector('button[type="submit"]');
    button.dataset.label = button.textContent;
    essayForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      setLoading(button, true);
      try {
        const data = await essayBuilder({
          type: essayForm.type.value,
          topic: essayForm.topic.value.trim(),
          subject: 'general'
        });
        showResult(data.result || 'No output');
      } catch (err) {
        showResult(`Error: ${err.message}`);
      } finally {
        setLoading(button, false);
      }
    });
  }
})();
