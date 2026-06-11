"""Notion Save Service - saves Markdown reports as Notion child pages"""
import os
from dotenv import load_dotenv
load_dotenv()

from notion_client import Client
from markdown_parser import parse_markdown_to_blocks, chunk_blocks


def save_report_to_notion(title: str, markdown: str) -> dict:
    token = os.getenv('NOTION_TOKEN')
    parent_page_id = os.getenv('NOTION_PARENT_PAGE_ID')
    if not token or not parent_page_id:
        return {'success': False, 'error': 'Notion configuration incomplete, check environment variables'}
    notion = Client(auth=token)
    blocks = parse_markdown_to_blocks(markdown)
    all_batches = list(chunk_blocks(blocks))
    try:
        first_batch = all_batches[0] if all_batches else []
        page = notion.pages.create(
            parent={'type': 'page_id', 'page_id': parent_page_id},
            properties={'title': {'title': [{'type': 'text', 'text': {'content': title}}]}},
            children=first_batch
        )
        page_id = page['id']
        for batch in all_batches[1:]:
            notion.blocks.children.append(block_id=page_id, children=batch)
        notion_url = page.get('url', f'https://www.notion.so/{page_id.replace("-", "")}')
        return {'success': True, 'notion_url': notion_url}
    except Exception as e:
        error_msg = str(e)
        if 'unauthorized' in error_msg.lower() or '401' in error_msg:
            return {'success': False, 'error': 'Notion Token invalid or expired'}
        if 'restricted' in error_msg.lower() or '403' in error_msg:
            return {'success': False, 'error': 'Integration not connected to target parent page. Please connect it in Notion first.'}
        return {'success': False, 'error': f'Notion save failed: {error_msg}'}
