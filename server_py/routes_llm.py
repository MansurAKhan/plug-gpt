from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

try:
    from .llm_router import provider_health, provider_models, test_routing, LLMUnavailableError
except ImportError:
    from llm_router import provider_health, provider_models, test_routing, LLMUnavailableError

router = APIRouter()


class LLMTestRequest(BaseModel):
    prompt: str = 'Return the single word: READY'


@router.get('/health')
async def llm_health():
    return provider_health()


@router.get('/models')
async def llm_models():
    return provider_models()


@router.post('/test')
async def llm_test(req: LLMTestRequest):
    try:
        return test_routing(req.prompt)
    except LLMUnavailableError as err:
        raise HTTPException(status_code=503, detail={'error': str(err), 'attempts': err.attempts})
