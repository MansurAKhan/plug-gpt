from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

try:
    from .groq_service import get_default_system_prompt
    from .llm_router import generate_response, debug_enabled, LLMUnavailableError
except ImportError:
    from groq_service import get_default_system_prompt
    from llm_router import generate_response, debug_enabled, LLMUnavailableError

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    subject: str = 'general'
    mode: str = 'chat'
    context: str = ''

@router.post('')
@router.post('/')
async def chat_endpoint(req: ChatRequest):
    message = req.message
    if not message or message.strip() == '':
        raise HTTPException(status_code=400, detail={'error': 'Message is required'})

    if check_for_cheating_attempt(message):
        return {
            'message': (
                "I understand you're looking for help. Instead of providing a direct answer, let me guide you:\n\n"
                "- What specific part are you struggling with?\n- What have you tried so far?\n- What concepts or methods might apply here?\n\n"
                "I'm here to help you learn and understand, not to do the work for you. Let's work through this step by step!"
            )
        }

    try:
        out = generate_response(message, {
            'subject': req.subject,
            'mode': req.mode,
            'context': req.context,
            'systemPrompt': get_default_system_prompt(req.subject, req.mode),
        })
        payload = {'message': out['content']}
        if debug_enabled():
            payload.update({
                'provider_used': out['provider_used'],
                'model_used': out['model_used'],
                'fallback_depth': out['fallback_depth'],
            })
        return payload
    except LLMUnavailableError as e:
        raise HTTPException(status_code=503, detail={'error': str(e), 'attempts': e.attempts})
    except Exception as e:
        raise HTTPException(status_code=500, detail={'error': str(e)})


def check_for_cheating_attempt(message: str) -> bool:
    cheating_keywords = [
        'do my homework',
        'write my essay',
        'complete my assignment',
        'solve this for me without explanation',
        'give me the answer',
        'do this for me',
    ]
    lower = message.lower()
    return any(k in lower for k in cheating_keywords)
