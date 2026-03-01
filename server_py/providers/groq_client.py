import os
import requests

try:
    from .base import LLMProviderError, classify_http_error, classify_request_exception
except ImportError:
    from providers.base import LLMProviderError, classify_http_error, classify_request_exception


class GroqClient:
    provider = 'groq'

    def __init__(self):
        self.base_url = os.getenv('GROQ_API_URL', 'https://api.groq.com/openai/v1').rstrip('/')
        self.api_key = os.getenv('GROQ_API_KEY', '').strip()

    def is_configured(self) -> bool:
        return bool(self.api_key)

    def chat(self, model: str, messages: list[dict], timeout: int):
        if not self.is_configured():
            raise LLMProviderError(self.provider, 'auth', 'GROQ_API_KEY is missing', status_code=401, model=model, transient=False)

        payload = {
            'model': model,
            'messages': messages,
            'temperature': 0.7,
            'max_tokens': 2048,
        }
        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json',
        }

        last_error = None
        for url in self._candidate_chat_urls():
            try:
                resp = requests.post(url, json=payload, headers=headers, timeout=timeout)
            except Exception as exc:
                error_class, transient = classify_request_exception(exc)
                last_error = LLMProviderError(self.provider, error_class, str(exc), model=model, transient=transient)
                continue

            if resp.status_code == 200:
                data = resp.json()
                content = data.get('choices', [{}])[0].get('message', {}).get('content', '')
                if not content:
                    raise LLMProviderError(self.provider, 'response_parse', 'Missing message content', model=model, transient=False)
                return content

            error_class, transient = classify_http_error(resp.status_code, resp.text)
            last_error = LLMProviderError(self.provider, error_class, resp.text, status_code=resp.status_code, model=model, transient=transient)

            lower = (resp.text or '').lower()
            # Some Groq configs use /openai/v1 while others use /v1; retry with alternate URL on unknown_url.
            if 'unknown_url' in lower or 'unknown request url' in lower:
                continue
            break

        if last_error:
            raise last_error
        raise LLMProviderError(self.provider, 'request_error', 'Unknown Groq request failure', model=model, transient=False)

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

    def _candidate_chat_urls(self) -> list[str]:
        base = self.base_url.rstrip('/')
        candidates = [f'{base}/chat/completions']

        if base.endswith('/v1') and not base.endswith('/openai/v1'):
            candidates.append(f'{base[:-3]}/openai/v1/chat/completions')
        elif base.endswith('/openai/v1'):
            candidates.append(f'{base[:-10]}/v1/chat/completions')
        elif base.endswith('/openai'):
            candidates.append(f'{base}/v1/chat/completions')
        elif base.endswith('/api.groq.com'):
            candidates.append(f'{base}/openai/v1/chat/completions')
            candidates.append(f'{base}/v1/chat/completions')

        # Deduplicate while preserving order.
        seen = set()
        ordered = []
        for item in candidates:
            if item not in seen:
                seen.add(item)
                ordered.append(item)
        return ordered
