import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db

TEST_DB_URL = "sqlite:///./test_taskflow.db"
test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestingSession()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def reset_db():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def client():
    return TestClient(app)


# ── POST /api/tasks ─────────────────────────────────────

def test_create_task_success(client):
    res = client.post("/api/tasks", json={"title": "테스트 업무"})
    assert res.status_code == 201
    data = res.json()
    assert data["title"] == "테스트 업무"
    assert data["status"] == "todo"
    assert "description" in data


def test_create_task_with_due_at(client):
    res = client.post("/api/tasks", json={
        "title": "마감 있는 업무",
        "due_at": "2026-05-12T18:00:00Z"
    })
    assert res.status_code == 201
    assert res.json()["due_at"] == "2026-05-12T18:00:00Z"


def test_create_task_missing_title(client):
    res = client.post("/api/tasks", json={"description": "설명만 있음"})
    assert res.status_code == 400
    assert "error" in res.json()


def test_create_task_empty_title(client):
    res = client.post("/api/tasks", json={"title": "   "})
    assert res.status_code == 400
    assert "error" in res.json()


def test_create_task_invalid_status(client):
    res = client.post("/api/tasks", json={"title": "업무", "status": "invalid_status"})
    assert res.status_code == 400
    assert "error" in res.json()


def test_create_task_invalid_due_at(client):
    res = client.post("/api/tasks", json={"title": "업무", "due_at": "not-a-date"})
    assert res.status_code == 400
    assert "error" in res.json()


# ── GET /api/tasks ──────────────────────────────────────

def test_list_tasks(client):
    client.post("/api/tasks", json={"title": "업무 1"})
    client.post("/api/tasks", json={"title": "업무 2"})
    res = client.get("/api/tasks")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 2
    assert "description" in data[0]  # 목록에서 description 포함 확인


def test_list_tasks_empty(client):
    res = client.get("/api/tasks")
    assert res.status_code == 200
    assert res.json() == []


# ── GET /api/tasks/:id ──────────────────────────────────

def test_get_task_success(client):
    created = client.post("/api/tasks", json={
        "title": "단건 조회",
        "description": "설명 포함"
    }).json()
    res = client.get(f"/api/tasks/{created['id']}")
    assert res.status_code == 200
    data = res.json()
    assert data["title"] == "단건 조회"
    assert data["description"] == "설명 포함"  # 단건에서 description 포함 확인


def test_get_task_not_found(client):
    res = client.get("/api/tasks/9999")
    assert res.status_code == 404
    assert res.json() == {"error": "task not found"}


# ── PUT /api/tasks/:id ──────────────────────────────────

def test_update_task_partial(client):
    created = client.post("/api/tasks", json={"title": "수정 전"}).json()
    res = client.put(f"/api/tasks/{created['id']}", json={"status": "in_progress"})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "in_progress"
    assert data["title"] == "수정 전"  # 보내지 않은 필드는 기존값 유지


def test_update_task_not_found(client):
    res = client.put("/api/tasks/9999", json={"status": "done"})
    assert res.status_code == 404
    assert res.json() == {"error": "task not found"}


# ── DELETE /api/tasks/:id ───────────────────────────────

def test_delete_task_success(client):
    created = client.post("/api/tasks", json={"title": "삭제 대상"}).json()
    res = client.delete(f"/api/tasks/{created['id']}")
    assert res.status_code == 204
    assert client.get(f"/api/tasks/{created['id']}").status_code == 404  # 재조회 시 404


def test_delete_task_not_found(client):
    res = client.delete("/api/tasks/9999")
    assert res.status_code == 404
    assert res.json() == {"error": "task not found"}
