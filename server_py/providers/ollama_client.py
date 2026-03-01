import os
import requests

try:
    from .base import LLMProviderError, classify_http_error, classify_request_exception
except ImportError:
    from providers.base import LLMProviderError, classify_http_error, classify_request_exception


class OllamaClient:
    provider = 'ollama'

    def __init__(self):
        self.base_url = os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434').rstrip('/')

    def is_configured(self) -> bool:
        # Local fallback should always be considered configured; runtime availability is checked via network/model responses.
        return True

    def chat(self, model: str, messages: list[dict], timeout: int):
        payload = {
            'model': model,
            'messages': messages,
            'stream': False,
            'options': {
                'temperature': 0.7,
            },
        }

        try:
            resp = requests.post(f'{self.base_url}/api/chat', json=payload, timeout=timeout)
        except Exception as exc:
            error_class, transient = classify_request_exception(exc)
            raise LLMProviderError(self.provider, error_class, str(exc), model=model, transient=transient) from exc

        if resp.status_code != 200:
            error_class, transient = classify_http_error(resp.status_code, resp.text)
            raise LLMProviderError(self.provider, error_class, resp.text, status_code=resp.status_code, model=model, transient=transient)

        data = resp.json()
        content = data.get('message', {}).get('content', '')
        if not content:
            raise LLMProviderError(self.provider, 'response_parse', 'Missing message content', model=model, transient=False)
        return content

    def health(self, models: list[str], timeout: int):
        if not models:
            return {'status': 'error', 'selected_model': None, 'error_class': 'model_not_found', 'message': 'No models configured'}

        last_err = None
        for model in models:
            try:
                self.chat(model, [{'role': 'user', 'content': 'ping'}], timeout)
                if last_err is not None:
                    return {'status': 'degraded', 'selected_model': model, 'error_class': last_err.error_class, 'message': last_err.message}
                return {'status': 'ok', 'selected_model': model}
            except LLMProviderError as err:
                last_err = err
                continue

        return {
            'status': 'error',
            'selected_model': last_err.model if last_err else (models[0] if models else None),
            'error_class': last_err.error_class if last_err else 'request_error',
            'message': last_err.message if last_err else 'Unknown provider error',
        }
