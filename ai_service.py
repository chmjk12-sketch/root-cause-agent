"""AI Analysis Service - calls external AI API to generate root cause analysis reports (supports SSE streaming)"""
import os
import json
import httpx
from typing import AsyncGenerator
from dotenv import load_dotenv
load_dotenv()


SYSTEM_PROMPT_PATH = os.getenv('SYSTEM_PROMPT_PATH', 'system_prompt.txt')


def _load_system_prompt() -> str:
    with open(SYSTEM_PROMPT_PATH, 'r', encoding='utf-8') as f:
        return f.read()


async def stream_analysis(problem: str, model: str = None) -> AsyncGenerator[str, None]:
    api_key = os.getenv('AI_API_KEY')
    api_base = os.getenv('AI_API_BASE', 'https://api.deepseek.com/v1')
    default_model = os.getenv('AI_DEFAULT_MODEL', 'deepseek-chat')
    model = model or default_model
    system_prompt = _load_system_prompt()
    url = f"{api_base.rstrip('/')}/chat/completions"
    headers = {'Content-Type': 'application/json', 'Authorization': f'Bearer {api_key}'}
    payload = {
        'model': model,
        'messages': [
            {'role': 'system', 'content': system_prompt},
            {'role': 'user', 'content': f'请分析以下商业痛点：\n\n{problem}'}
        ],
        'stream': True, 'temperature': 0.7, 'max_tokens': 4096,
    }
    async with httpx.AsyncClient(timeout=60.0) as client:
        async with client.stream('POST', url, json=payload, headers=headers) as response:
            if response.status_code != 200:
                error_body = await response.aread()
                error_msg = f"AI API request failed ({response.status_code}): {error_body.decode()}"
                yield json.dumps({'error': error_msg})
                return
            async for line in response.aiter_lines():
                line = line.strip()
                if not line or not line.startswith('data:'):
                    continue
                data = line[5:].strip()
                if data == '[DONE]':
                    continue
                try:
                    json_data = json.loads(data)
                    delta = json_data.get('choices', [{}])[0].get('delta', {}).get('content', '')
                    if delta:
                        yield json.dumps({'delta': delta})
                except json.JSONDecodeError:
                    continue


async def analyze_full(problem: str, model: str = None) -> dict:
    full_text = ''
    async for chunk in stream_analysis(problem, model):
        data = json.loads(chunk)
        if 'error' in data:
            return {'success': False, 'error': data['error']}
        full_text += data.get('delta', '')
    return {'success': True, 'report': {'markdown': full_text, 'title': problem}}
