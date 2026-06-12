"""Root Cause Analysis Agent Backend API - FastAPI entry point"""
import os
import json
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.responses import StreamingResponse, JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from models import AnalyzeRequest, SaveToNotionRequest, HealthResponse
from ai_service import stream_analysis, analyze_full
from notion_service import save_report_to_notion
import reports

app = FastAPI(title="Root Cause Analysis Agent API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files - serve the frontend HTML for local testing
STATIC_DIR = os.path.join(os.path.dirname(__file__), 'static')
if not os.path.exists(STATIC_DIR):
    os.makedirs(STATIC_DIR)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/")
async def index():
    """Serve the frontend HTML page"""
    html_path = os.path.join(STATIC_DIR, '根因分析Agent.html')
    if not os.path.exists(html_path):
        html_path = os.path.join(STATIC_DIR, 'index.html')
    if os.path.exists(html_path):
        return FileResponse(html_path)
    return {"message": "Backend API is running. Place the frontend HTML in the static/ directory.", "docs": "/docs"}


@app.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(status="ok", version="1.0.0")


@app.post("/analyze")
async def analyze(req: AnalyzeRequest):
    problem = req.problem.strip()
    if not problem:
        return JSONResponse(status_code=400, content={"success": False, "error": "Please enter a business pain point"})
    async def event_stream():
        yield "event: start\ndata: {}\n\n"
        async for chunk in stream_analysis(problem, req.model):
            data = json.loads(chunk)
            if 'error' in data:
                yield f"event: error\ndata: {json.dumps(data)}\n\n"
                return
            yield f"event: delta\ndata: {chunk}\n\n"
        yield "event: done\ndata: {}\n\n"
    return StreamingResponse(
        event_stream(), media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"}
    )


@app.post("/analyze-full")
async def analyze_full(req: AnalyzeRequest):
    problem = req.problem.strip()
    if not problem:
        return JSONResponse(status_code=400, content={"success": False, "error": "Please enter a business pain point"})
    async def event_stream():
        async for chunk in stream_analysis(problem, req.model):
            data = json.loads(chunk)
            if 'error' in data:
                yield f"data: {json.dumps({'error': data['error']})}\n\n"
                return
            yield f"data: {chunk}\n\n"
        yield "data: [DONE]\n\n"
    return StreamingResponse(
        event_stream(), media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"}
    )


@app.post("/analyze-full-sync")
async def analyze_full_sync(req: AnalyzeRequest):
    """Synchronous endpoint: returns the full analysis as JSON (for mini program clients)"""
    problem = req.problem.strip()
    if not problem:
        return JSONResponse(status_code=400, content={"success": False, "error": "Please enter a business pain point"})
    result = await analyze_full(problem, req.model)
    if not result.get('success'):
        return JSONResponse(status_code=500, content=result)
    return result


@app.post("/save-to-notion")
async def save_to_notion(req: SaveToNotionRequest):
    if not req.title.strip() or not req.markdown.strip():
        return JSONResponse(status_code=400, content={"success": False, "error": "Title and content cannot be empty"})
    result = save_report_to_notion(req.title, req.markdown)
    return result


# ===== Reports CRUD API =====

@app.get("/reports")
async def list_reports():
    return {"success": True, "reports": reports.get_all()}


@app.get("/reports/{report_id}")
async def get_report(report_id: str):
    r = reports.get_one(report_id)
    if not r:
        return JSONResponse(status_code=404, content={"success": False, "error": "Report not found"})
    return {"success": True, "report": r}


@app.post("/reports")
async def create_report(body: dict):
    report = reports.create(body)
    return {"success": True, "report": report}


@app.patch("/reports/{report_id}/star")
async def star_report(report_id: str):
    r = reports.toggle_star(report_id)
    if not r:
        return JSONResponse(status_code=404, content={"success": False, "error": "Report not found"})
    return {"success": True, "report": r}


@app.delete("/reports/{report_id}")
async def delete_report(report_id: str):
    ok = reports.delete(report_id)
    if not ok:
        return JSONResponse(status_code=404, content={"success": False, "error": "Report not found"})
    return {"success": True}


@app.delete("/reports")
async def clear_reports():
    reports.clear_all()
    return {"success": True}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
