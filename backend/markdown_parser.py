"""
Markdown to Notion Block parser.

Supports: heading_2, heading_3, paragraph (with bold),
      bulleted_list_item, numbered_list_item,
      divider, quote, table + table_row
"""
import re
from typing import List, Dict, Any


def parse_markdown_to_blocks(markdown: str) -> List[Dict[str, Any]]:
    """Parse Markdown text into Notion Block array"""
    lines = markdown.split('\n')
    blocks = []
    i = 0

    while i < len(lines):
        line = lines[i].rstrip()

        if not line.strip():
            i += 1
            continue

        # Multi-line table matching
        if line.startswith('|') and (i + 1 < len(lines) and lines[i + 1].strip().startswith('|')):
            table_rows = []
            while i < len(lines) and lines[i].strip().startswith('|'):
                table_rows.append(lines[i].strip())
                i += 1
            table_block = _parse_table(table_rows)
            if table_block:
                blocks.append(table_block)
            continue

        if line.startswith('## '):
            text = line[3:].strip()
            blocks.append(_heading_block('heading_2', text))
            i += 1
            continue

        if line.startswith('### '):
            text = line[4:].strip()
            blocks.append(_heading_block('heading_3', text))
            i += 1
            continue

        if re.match(r'^---+\s*$', line):
            blocks.append({'type': 'divider', 'divider': {}})
            i += 1
            continue

        if line.startswith('> '):
            text = line[2:].strip()
            blocks.append(_paragraph_block(text, 'quote'))
            i += 1
            continue

        if line.startswith('- '):
            text = line[2:].strip()
            blocks.append(_paragraph_block(text, 'bulleted_list_item'))
            i += 1
            continue

        if re.match(r'^\d+\.\s', line):
            text = re.sub(r'^\d+\.\s+', '', line)
            blocks.append(_paragraph_block(text, 'numbered_list_item'))
            i += 1
            continue

        blocks.append(_paragraph_block(line, 'paragraph'))
        i += 1

    return _merge_consecutive_list_blocks(blocks)


def _rich_text_builder(text: str) -> List[Dict[str, Any]]:
    parts = []
    last_end = 0
    for match in re.finditer(r'\*\*(.+?)\*\*', text):
        if match.start() > last_end:
            parts.append(_text_part(text[last_end:match.start()], False))
        parts.append(_text_part(match.group(1), True))
        last_end = match.end()
    if last_end < len(text):
        parts.append(_text_part(text[last_end:], False))
    return parts if parts else [_text_part(text, False)]


def _text_part(text: str, bold: bool = False) -> Dict[str, Any]:
    return {
        'type': 'text',
        'text': {'content': text},
        'annotations': {
            'bold': bold, 'italic': False, 'strikethrough': False,
            'underline': False, 'code': False, 'color': 'default'
        }
    }


def _heading_block(block_type: str, text: str) -> Dict[str, Any]:
    return {
        'type': block_type,
        block_type: {'rich_text': _rich_text_builder(text), 'color': 'default'}
    }


def _paragraph_block(text: str, block_type: str = 'paragraph') -> Dict[str, Any]:
    if block_type == 'quote':
        return {'type': block_type, block_type: {'rich_text': _rich_text_builder(text), 'color': 'default'}}
    if block_type in ('bulleted_list_item', 'numbered_list_item'):
        return {'type': block_type, block_type: {'rich_text': _rich_text_builder(text), 'color': 'default'}}
    return {'type': 'paragraph', 'paragraph': {'rich_text': _rich_text_builder(text), 'color': 'default'}}


def _parse_table(rows: List[str]) -> Dict[str, Any]:
    if len(rows) < 2:
        return None
    data_rows = [r for r in rows if not re.match(r'^\|[\s:-]+\|$', r)]
    if len(data_rows) < 1:
        return None
    header_cells = [c.strip() for c in data_rows[0].split('|') if c.strip()]
    table_width = len(header_cells)
    children = []
    header_row = {
        'type': 'table_row',
        'table_row': {
            'cells': [[{'type': 'text', 'text': {'content': c}, 'annotations': {'bold': True}}] for c in header_cells]
        }
    }
    children.append(header_row)
    for row in data_rows[1:]:
        cells = [c.strip() for c in row.split('|') if c.strip()]
        while len(cells) < table_width:
            cells.append('')
        cells = cells[:table_width]
        row_block = {
            'type': 'table_row',
            'table_row': {'cells': [[{'type': 'text', 'text': {'content': c}}] for c in cells]}
        }
        children.append(row_block)
    return {
        'type': 'table',
        'table': {'table_width': table_width, 'has_column_header': True, 'has_row_header': False, 'children': children}
    }


def _merge_consecutive_list_blocks(blocks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Remove deep nesting from list items — Notion renders consecutive same-type
    list blocks as a single list automatically, no nesting needed."""
    return blocks


def chunk_blocks(blocks: List[Dict[str, Any]], max_size: int = 100):
    for i in range(0, len(blocks), max_size):
        yield blocks[i:i + max_size]
