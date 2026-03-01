import requests


class LLMProviderError(Exception):
    def __init__(self, provider: str, error_class: str, message: str, status_code: int = 500, model: str | None = None, transient: bool = False):
        self.provider = provider
        self.error_class = error_class
        self.message = message
        self.status_code = status_code
        self.model = model
        self.transient = transient
        super().__init__(f"[{provider}] {error_class}: {message}")


def classify_http_error(status_code: int, body: str) -> tuple[str, bool]:
    lower = (body or '').lower()

    if status_code in (401, 403):
        return ('auth', False)
    if status_code == 404 and 'model' in lower:
        return ('model_not_found', False)
    if status_code == 429:
        if 'quota' in lower or 'insufficient' in lower:
            return ('quota', False)
        return ('rate_limit', True)
    if 500 <= status_code <= 599:
        return ('provider_error', True)
    return ('request_error', False)


def classify_request_exception(exc: Exception) -> tuple[str, bool]:
    if isinstance(exc, requests.Timeout):
        return ('timeout', True)
    if isinstance(exc, requests.ConnectionError):
        return ('network', True)
    return ('request_error', False)
