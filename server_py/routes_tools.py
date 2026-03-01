import json
from pathlib import Path
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from groq_service import get_default_system_prompt
from llm_router import generate_response, debug_enabled, LLMUnavailableError
from java_bridge import get_text_metrics

router = APIRouter()
ROOT_DIR = Path(__file__).resolve().parents[1]
PROMPTS_PATH = ROOT_DIR / 'config' / 'prompts.json'

with PROMPTS_PATH.open('r', encoding='utf-8') as f:
    PROMPTS_CONFIG = json.load(f)

class ExplainRequest(BaseModel):
    topic: str
    subject: str = 'general'
    level: str = 'high-school'

class BreakdownRequest(BaseModel):
    content: str
    subject: str = 'general'

class MathSolveRequest(BaseModel):
    problem: str
    hideAnswer: bool = False

class RewriteRequest(BaseModel):
    text: str
    style: str = 'neutral'

class EssayBuilderRequest(BaseModel):
    type: str
    topic: str
    subject: str = 'general'

class IBToolRequest(BaseModel):
    tool: str
    topic: str = None
    subject: str = 'general'

class TextMetricsRequest(BaseModel):
    text: str


def _tool_payload(result_text: str, out: dict):
    payload = {'result': result_text}
    if debug_enabled():
        payload.update({
            'provider_used': out.get('provider_used'),
            'model_used': out.get('model_used'),
            'fallback_depth': out.get('fallback_depth'),
        })
    return payload


@router.post('/explain')
async def explain(req: ExplainRequest):
    prompt = f'Explain the topic "{req.topic}" at {req.level} level. Provide a structured explanation with clear headings.'
    try:
        out = generate_response(prompt, {
            'subject': req.subject,
            'mode': 'explain',
            'systemPrompt': get_default_system_prompt(req.subject, 'explain'),
        })
        return _tool_payload(out['content'], out)
    except LLMUnavailableError as e:
        raise HTTPException(status_code=503, detail={'error': str(e), 'attempts': e.attempts})
    except Exception as e:
        raise HTTPException(status_code=500, detail={'error': str(e)})

@router.post('/breakdown')
async def breakdown(req: BreakdownRequest):
    prompt = f"Break down the following content:\n\n{req.content}\n\nProvide: bullet summary, key terms, main arguments, and a short quiz."
    try:
        out = generate_response(prompt, {
            'subject': req.subject,
            'mode': 'breakdown',
            'systemPrompt': get_default_system_prompt(req.subject, 'breakdown'),
        })
        response = out['content']
        metrics = get_text_metrics(req.content)
        if metrics:
            response += (
                "\n\n---\n"
                "Java Text Metrics:\n"
                f"- Characters: {metrics.get('characters', 0)}\n"
                f"- Words: {metrics.get('words', 0)}\n"
                f"- Sentences: {metrics.get('sentences', 0)}"
            )
        return _tool_payload(response, out)
    except LLMUnavailableError as e:
        raise HTTPException(status_code=503, detail={'error': str(e), 'attempts': e.attempts})
    except Exception as e:
        raise HTTPException(status_code=500, detail={'error': str(e)})

@router.post('/math-solve')
async def math_solve(req: MathSolveRequest):
    prompt = f"Solve this math problem step-by-step: {req.problem}\n\nShow all work clearly.{' Do not reveal the final answer until the student requests it.' if req.hideAnswer else ''}"
    try:
        out = generate_response(prompt, {
            'subject': 'math',
            'mode': 'math_solver',
            'systemPrompt': get_default_system_prompt('math', 'math_solver'),
        })
        return _tool_payload(out['content'], out)
    except LLMUnavailableError as e:
        raise HTTPException(status_code=503, detail={'error': str(e), 'attempts': e.attempts})
    except Exception as e:
        raise HTTPException(status_code=500, detail={'error': str(e)})

@router.post('/rewrite')
async def rewrite(req: RewriteRequest):
    prompt = f"Rewrite the following text in a {req.style} style while maintaining its meaning:\n\n{req.text}"
    try:
        out = generate_response(prompt, {
            'subject': 'general',
            'mode': 'rewrite',
            'systemPrompt': get_default_system_prompt('general', 'rewrite'),
        })
        return _tool_payload(out['content'], out)
    except LLMUnavailableError as e:
        raise HTTPException(status_code=503, detail={'error': str(e), 'attempts': e.attempts})
    except Exception as e:
        raise HTTPException(status_code=500, detail={'error': str(e)})

@router.post('/grammar-fix')
async def grammar_fix(req: RewriteRequest):
    prompt = f"Fix grammar and improve clarity of this text while maintaining the original meaning:\n\n{req.text}"
    try:
        out = generate_response(prompt, {
            'subject': 'general',
            'mode': 'grammar',
            'systemPrompt': get_default_system_prompt('general', 'grammar'),
        })
        return _tool_payload(out['content'], out)
    except LLMUnavailableError as e:
        raise HTTPException(status_code=503, detail={'error': str(e), 'attempts': e.attempts})
    except Exception as e:
        raise HTTPException(status_code=500, detail={'error': str(e)})

@router.post('/essay-builder')
async def essay_builder(req: EssayBuilderRequest):
    prompt = f"Help me build an essay {req.type} for the topic: \"{req.topic}\". Subject: {req.subject}."
    try:
        out = generate_response(prompt, {
            'subject': req.subject,
            'mode': 'essay_builder',
            'systemPrompt': get_default_system_prompt(req.subject, 'essay_builder'),
        })
        return _tool_payload(out['content'], out)
    except LLMUnavailableError as e:
        raise HTTPException(status_code=503, detail={'error': str(e), 'attempts': e.attempts})
    except Exception as e:
        raise HTTPException(status_code=500, detail={'error': str(e)})

@router.post('/ib-tool')
async def ib_tool(req: IBToolRequest):
    tool = req.tool
    topic = req.topic
    subject = req.subject or 'general'

    template_map = PROMPTS_CONFIG.get('ib_prompts', {})
    topic_value = topic or 'essay/exhibition'
    topic_clause = f'Focus on: {topic}' if topic else 'Provide project ideas, reflection templates, and weekly log structures.'
    prompt_map = {
        'ia': template_map.get('ia', 'Help me with my IB Internal Assessment on "{topic}" in {subject}.').format(topic=topic_value, subject=subject),
        'tok': template_map.get('tok', 'Help me with my TOK {topic}.').format(topic=topic_value, subject=subject),
        'cas': template_map.get('cas', 'Help me with CAS. {topic_clause}').format(topic=topic_value, subject=subject, topic_clause=topic_clause),
        'ee': template_map.get('ee', 'Help me with my Extended Essay on "{topic}" in {subject}.').format(topic=topic_value, subject=subject),
    }

    prompt = prompt_map.get(tool, prompt_map['ia'])
    try:
        mode = f'{tool}_helper'
        out = generate_response(prompt, {
            'subject': subject,
            'mode': mode,
            'systemPrompt': get_default_system_prompt(subject, mode),
        })
        return _tool_payload(out['content'], out)
    except LLMUnavailableError as e:
        raise HTTPException(status_code=503, detail={'error': str(e), 'attempts': e.attempts})
    except Exception as e:
        raise HTTPException(status_code=500, detail={'error': str(e)})


@router.post('/text-metrics')
async def text_metrics(req: TextMetricsRequest):
    metrics = get_text_metrics(req.text)
    if metrics is None:
        text = req.text or ''
        return {
            'result': {
                'characters': len(text),
                'words': len(text.strip().split()) if text.strip() else 0,
                'sentences': max(1, sum(text.count(mark) for mark in '.!?')) if text.strip() else 0,
                'source': 'python-fallback',
            }
        }
    metrics['source'] = 'java'
    return {'result': metrics}
