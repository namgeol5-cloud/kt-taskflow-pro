from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, field_validator, field_serializer
from app.models import TaskStatus


def _to_utc_naive(dt: datetime) -> datetime:
    if dt.tzinfo is not None:
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


def _parse_due_at(v) -> Optional[datetime]:
    if v is None:
        return None
    if isinstance(v, datetime):
        return _to_utc_naive(v)
    if isinstance(v, str):
        try:
            dt = datetime.fromisoformat(v.replace("Z", "+00:00"))
            return _to_utc_naive(dt)
        except ValueError:
            raise ValueError("due_at must be ISO 8601 format")
    raise ValueError("due_at must be ISO 8601 format")


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.todo
    due_at: Optional[datetime] = None

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("title must not be empty")
        return v.strip()

    @field_validator("due_at", mode="before")
    @classmethod
    def normalize_due_at(cls, v):
        return _parse_due_at(v)


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    due_at: Optional[datetime] = None

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not v.strip():
            raise ValueError("title must not be empty")
        return v.strip() if v else v

    @field_validator("due_at", mode="before")
    @classmethod
    def normalize_due_at(cls, v):
        return _parse_due_at(v)


class TaskListItem(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    status: TaskStatus
    due_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

    @field_serializer("due_at", "created_at", "updated_at")
    def serialize_dt(self, v: Optional[datetime]) -> Optional[str]:
        if v is None:
            return None
        return v.strftime("%Y-%m-%dT%H:%M:%SZ")


class TaskDetail(TaskListItem):
    pass
