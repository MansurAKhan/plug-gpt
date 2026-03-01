import os
import requests

try:
    from .base import LLMProviderError, classify_http_error, classify_request_exception
except ImportError:
    from providers.base import LLMProviderError, classify_http_error, classify_request_exception


class OpenRouterClient:
    provider = 'openrouter'

    def __init__(self):
        self.base_url = os.getenv('OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1').rstrip('/')
        self.api_key = os.getenv('OPENROUTER_API_KEY', '').strip()

    def is_configured(self) -> bool:
        return bool(self.api_key)

    def chat(self, model: str, messages: list[dict], timeout: int):
        if not self.is_configured():
            raise LLMProviderError(self.provider, 'auth', 'OPENROUTER_API_KEY is missing', status_code=401, model=model, transient=False)

        payload = {
            'model': model,
            'messages': messages,
            'temperature': 0.7,
            'max_tokens': 2048,
        }
        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json',
            'HTTP-Referer': os.getenv('OPENROUTER_SITE_URL', 'http://localhost:8000'),
            'X-Title': os.getenv('OPENROUTER_APP_NAME', 'PlugGPT'),
        }

        try:
            resp = requests.post(f'{self.base_url}/chat/completions', json=payload, headers=headers, timeout=timeout)
        except Exception as exc:
            error_class, transient = classify_request_exception(exc)
            raise LLMProviderError(self.provider, error_class, str(exc), model=model, transient=transient) from exc

        if resp.status_code != 200:
            error_class, transient = classify_http_error(resp.status_code, resp.text)
            raise LLMProviderError(self.provider, error_class, resp.text, status_code=resp.status_code, model=model, transient=transient)

        data = resp.json()
        content = data.get('choices', [{}])[0].get('message', {}).get('content', '')
        if not content:
            raise LLMProviderError(self.provider, 'response_parse', 'Missing message content', model=model, transient=False)
        return content

    def health(self, models: list[str], timeout: int):
        if not self.is_configured():
            return {'status': 'unconfigured', 'selected_model': models[0] if models else None}
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
