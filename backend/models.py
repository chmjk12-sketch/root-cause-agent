from pydantic import BaseModel
from typing import Optional


class AnalyzeRequest(BaseModel):
    problem: str
    model: Optional[str] = None


class AnalyzeResponse(BaseModel):
    success: bool
    report: Optional[dict] = None
    error: Optional[str] = None


class SaveToNotionRequest(BaseModel):
    title: str
    markdown: str


class SaveToNotionResponse(BaseModel):
    success: bool
    notion_url: Optional[str] = None
    error: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    version: str
