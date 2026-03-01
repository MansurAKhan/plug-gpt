import json
import os
from datetime import datetime
from pathlib import Path

from providers.base import LLMProviderError
from providers.groq_client import GroqClient
from providers.openrouter_client import OpenRouterClient
from providers.ollama_client import OllamaClient

ROOT_DIR = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT_DIR / 'config' / 'llm_providers.json'

CLIENTS = {
    'groq': GroqClient(),
    'openrouter': OpenRouterClient(),
    'ollama': OllamaClient(),
}

_LAST_ERRORS: dict[str, dict] = {}


class LLMUnavailableError(Exception):
    def __init__(self, message: str, attempts: list[dict]):
        self.attempts = attempts
        super().__init__(message)


def _load_config() -> dict:
    with CONFIG_PATH.open('r', encoding='utf-8') as f:
        return json.load(f)


def _timeout_seconds() -> int:
    raw = os.getenv('LLM_TIMEOUT_SECONDS', '60')
    try:
        return max(5, int(raw))
    except ValueError:
        return 60


def _debug_enabled() -> bool:
    return os.getenv('LLM_DEBUG', 'false').lower() == 'true'


def _provider_order(cfg: dict) -> list[str]:
    order_raw = os.getenv('LLM_PROVIDER_ORDER', '').strip()
    if order_raw:
        order = [part.strip().lower() for part in order_raw.split(',') if part.strip()]
    else:
        order = cfg.get('provider_order', ['groq', 'openrouter', 'ollama'])
    return [name for name in order if name in CLIENTS]


def _models_for(provider_name: str, cfg: dict) -> list[str]:
    by_provider = cfg.get('providers', {}).get(provider_name, {})
    default_model = os.getenv(f'{provider_name.upper()}_DEFAULT_MODEL', '').strip()
    configured = by_provider.get('models', [])
    if default_model:
        return [default_model] + [m for m in configured if m != default_model]
    return configured


def _build_messages(prompt: str, options: dict) -> list[dict]:
    messages = [{'role': 'system', 'content': options.get('systemPrompt', '')}]
    context = options.get('context', '')
    if context:
        messages.append({'role': 'user', 'content': f'Context: {context}'})
    messages.append({'role': 'user', 'content': prompt})
    return messages


def _mark_error(provider_name: str, err: LLMProviderError):
    _LAST_ERRORS[provider_name] = {
        'error_class': err.error_class,
        'message': err.message,
        'at': datetime.utcnow().isoformat() + 'Z',
        'model': err.model,
    }


def generate_response(prompt: str, options: dict | None = None) -> dict:
    options = options or {}
    cfg = _load_config()
    timeout = _timeout_seconds()
    order = _provider_order(cfg)
    attempts = []

    if not order:
        raise LLMUnavailableError('No LLM providers configured.', attempts=[])

    messages = _build_messages(prompt, options)

    for provider_index, provider_name in enumerate(order):
        client = CLIENTS[provider_name]
        models = _models_for(provider_name, cfg)
        if not models:
            attempts.append({'provider': provider_name, 'model': None, 'error_class': 'model_not_found', 'message': 'No models configured'})
            continue

        for model in models:
            try:
                content = client.chat(model, messages, timeout)
                result = {
                    'content': content,
                    'provider_used': provider_name,
                    'model_used': model,
                    'fallback_depth': provider_index,
                }
                return result
            except LLMProviderError as err:
                _mark_error(provider_name, err)
                attempts.append({'provider': provider_name, 'model': model, 'error_class': err.error_class, 'message': err.message, 'transient': err.transient})
                if err.transient:
                    # Single retry for transient failures.
                    try:
                        content = client.chat(model, messages, timeout)
                        return {
                            'content': content,
                            'provider_used': provider_name,
                            'model_used': model,
                            'fallback_depth': provider_index,
                        }
                    except LLMProviderError as retry_err:
                        _mark_error(provider_name, retry_err)
                        attempts.append({'provider': provider_name, 'model': model, 'error_class': retry_err.error_class, 'message': retry_err.message, 'transient': retry_err.transient, 'retried': True})
                # Try next model/provider.
                continue

    raise LLMUnavailableError(
        'No LLM provider available. Check API keys, network access, or start Ollama locally.',
        attempts=attempts,
    )


def provider_health() -> dict:
    cfg = _load_config()
    timeout = _timeout_seconds()
    order = _provider_order(cfg)
    items = {}

    for provider_name, client in CLIENTS.items():
        models = _models_for(provider_name, cfg)
        health = client.health(models, timeout)
        last_error = _LAST_ERRORS.get(provider_name)
        if last_error:
            health['last_error'] = last_error
        health['configured_models'] = models
        health['in_provider_order'] = provider_name in order
        items[provider_name] = health

    return {
        'provider_order': order,
        'timeout_seconds': timeout,
        'providers': items,
        'debug': _debug_enabled(),
    }


def provider_models() -> dict:
    cfg = _load_config()
    order = _provider_order(cfg)
    timeout = _timeout_seconds()
    result = {}

    for provider_name, client in CLIENTS.items():
        models = _models_for(provider_name, cfg)
        availability = []
        for model in models:
            try:
                client.chat(model, [{'role': 'user', 'content': 'ping'}], timeout)
                availability.append({'model': model, 'available': True})
            except LLMProviderError as err:
                availability.append({'model': model, 'available': False, 'error_class': err.error_class})

        result[provider_name] = {
            'in_provider_order': provider_name in order,
            'models': availability,
        }

    return {'providers': result, 'provider_order': order}


def test_routing(prompt: str = 'Return the single word: READY') -> dict:
    out = generate_response(prompt, options={'systemPrompt': 'You are a concise assistant.'})
    return {
        'ok': True,
        'provider_used': out['provider_used'],
        'model_used': out['model_used'],
        'fallback_depth': out['fallback_depth'],
        'preview': out['content'][:120],
    }


def debug_enabled() -> bool:
    return _debug_enabled()
