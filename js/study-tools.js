import { initializeShell } from './shell.js?v=20';
import { explain, breakdown, mathSolve } from './api.js?v=20';

function showResult(text) {
  const panel = document.getElementById('study-result');
  const result = document.getElementById('study-result-text');
  if (!panel || !result) {
    return;
  }
  result.textContent = text;
  panel.style.display = 'block';
}

function setLoading(button, loading) {
  if (!button) {
    return;
  }
  button.disabled = loading;
  button.textContent = loading ? 'Loading...' : button.dataset.label;
}

(async function start() {
  await initializeShell();

  const explainForm = document.getElementById('explain-form');
  const breakdownForm = document.getElementById('breakdown-form');
  const mathForm = document.getElementById('math-form');

  if (explainForm) {
    const button = explainForm.querySelector('button[type="submit"]');
    button.dataset.label = button.textContent;
    explainForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      setLoading(button, true);
      const topic = explainForm.topic.value.trim();
      try {
        const data = await explain({ topic });
        showResult(data.result || 'No output');
      } catch (err) {
        showResult(`Error: ${err.message}`);
      } finally {
        setLoading(button, false);
      }
    });
  }

  if (breakdownForm) {
    const button = breakdownForm.querySelector('button[type="submit"]');
    button.dataset.label = button.textContent;
    breakdownForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      setLoading(button, true);
      const content = breakdownForm.content.value.trim();
      try {
        const data = await breakdown({ content });
        showResult(data.result || 'No output');
      } catch (err) {
        showResult(`Error: ${err.message}`);
      } finally {
        setLoading(button, false);
      }
    });
  }

  if (mathForm) {
    const button = mathForm.querySelector('button[type="submit"]');
    button.dataset.label = button.textContent;
    mathForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      setLoading(button, true);
      const problem = mathForm.problem.value.trim();
      const hideAnswer = Boolean(mathForm.hideAnswer.checked);
      try {
        const data = await mathSolve({ problem, hideAnswer });
        showResult(data.result || 'No output');
      } catch (err) {
        showResult(`Error: ${err.message}`);
      } finally {
        setLoading(button, false);
      }
    });
  }
})();
