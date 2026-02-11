"""Pydantic schemas for API request / response."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class UpdateOut(BaseModel):
    id: int
    created_at: datetime
    source_type: str
    source_name: str
    title: str
    summary: str
    link_url: Optional[str] = None
    tags: str
    importance_score: float

    model_config = {"from_attributes": True}


class UpdateCreate(BaseModel):
    source_type: str
    source_name: str
    title: str
    summary: str = ""
    link_url: Optional[str] = None
    tags: str = ""
    importance_score: float = 0.5
    raw_meta: Optional[str] = None
