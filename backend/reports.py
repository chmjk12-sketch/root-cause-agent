"""Reports CRUD Service - SQLite backend for history & starred reports"""
import os
import sqlite3
import json
from typing import List, Dict, Any
from datetime import datetime

DB_PATH = os.environ.get('REPORTS_DB', os.path.join(os.path.dirname(__file__), 'reports.db'))


def _get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("""
        CREATE TABLE IF NOT EXISTS reports (
            id TEXT PRIMARY KEY,
            problem TEXT NOT NULL,
            domainId TEXT DEFAULT '_ai',
            date TEXT NOT NULL,
            starred INTEGER DEFAULT 0,
            goldenCause TEXT DEFAULT '',
            contradiction TEXT DEFAULT '',
            opportunities TEXT DEFAULT '[]',
            markdown TEXT DEFAULT ''
        )
    """)
    conn.commit()
    return conn


def get_all() -> List[Dict[str, Any]]:
    conn = _get_conn()
    rows = conn.execute(
        "SELECT * FROM reports ORDER BY rowid DESC"
    ).fetchall()
    conn.close()
    result = []
    for r in rows:
        d = dict(r)
        d['starred'] = bool(d['starred'])
        try:
            d['opportunities'] = json.loads(d['opportunities'])
        except (json.JSONDecodeError, TypeError):
            d['opportunities'] = []
        result.append(d)
    return result


def get_one(report_id: str) -> Dict[str, Any] | None:
    conn = _get_conn()
    row = conn.execute("SELECT * FROM reports WHERE id = ?", (report_id,)).fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    d['starred'] = bool(d['starred'])
    try:
        d['opportunities'] = json.loads(d['opportunities'])
    except (json.JSONDecodeError, TypeError):
        d['opportunities'] = []
    return d


def create(report: Dict[str, Any]) -> Dict[str, Any]:
    conn = _get_conn()
    report.setdefault('id', str(int(datetime.now().timestamp() * 1000)))
    report.setdefault('domainId', '_ai')
    report.setdefault('date', datetime.now().strftime('%Y/%m/%d %H:%M'))
    report.setdefault('starred', False)
    report.setdefault('goldenCause', 'AI分析生成')
    report.setdefault('contradiction', '详见AI分析报告')
    report.setdefault('opportunities', ['机会1', '机会2'])
    report.setdefault('markdown', '')

    opportunities_json = json.dumps(report.get('opportunities', []), ensure_ascii=False)
    conn.execute("""
        INSERT OR REPLACE INTO reports (id, problem, domainId, date, starred, goldenCause, contradiction, opportunities, markdown)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        report['id'],
        report.get('problem', ''),
        report.get('domainId', '_ai'),
        report.get('date', ''),
        1 if report.get('starred') else 0,
        report.get('goldenCause', ''),
        report.get('contradiction', ''),
        opportunities_json,
        report.get('markdown', '')
    ))
    conn.commit()
    conn.close()
    return report


def toggle_star(report_id: str) -> Dict[str, Any] | None:
    conn = _get_conn()
    row = conn.execute("SELECT id, starred FROM reports WHERE id = ?", (report_id,)).fetchone()
    if not row:
        conn.close()
        return None
    new_val = 0 if row['starred'] else 1
    conn.execute("UPDATE reports SET starred = ? WHERE id = ?", (new_val, report_id))
    conn.commit()
    updated = dict(conn.execute("SELECT * FROM reports WHERE id = ?", (report_id,)).fetchone())
    conn.close()
    updated['starred'] = bool(updated['starred'])
    try:
        updated['opportunities'] = json.loads(updated['opportunities'])
    except (json.JSONDecodeError, TypeError):
        updated['opportunities'] = []
    return updated


def delete(report_id: str) -> bool:
    conn = _get_conn()
    cur = conn.execute("DELETE FROM reports WHERE id = ?", (report_id,))
    deleted = cur.rowcount > 0
    conn.commit()
    conn.close()
    return deleted


def clear_all() -> bool:
    conn = _get_conn()
    conn.execute("DELETE FROM reports")
    conn.commit()
    conn.close()
    return True
