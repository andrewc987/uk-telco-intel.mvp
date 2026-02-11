"""SQLAlchemy ORM models."""

from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, Float, Text, DateTime
from database import Base


class Update(Base):
    __tablename__ = "updates"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    source_type = Column(String, index=True)          # policy | regulation | trade_press | news | forum | incident | curated
    source_name = Column(String, index=True)           # GOV.UK | Ofcom RSS | ThinkBroadband | …
    title = Column(String, nullable=False)
    summary = Column(Text, default="")
    link_url = Column(String, nullable=True)
    tags = Column(String, default="")                  # comma-separated
    importance_score = Column(Float, default=0.5)
    raw_meta = Column(Text, nullable=True)             # JSON blob
