const API_BASE = 'http://localhost:8000/api';

export async function fetchTasks() {
  const res = await fetch(`${API_BASE}/tasks`);
  if (!res.ok) throw new Error('목록 조회 실패');
  return res.json();
}

export async function createTask(data) {
  const res = await fetch(`${API_BASE}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || '생성 실패');
  }
  return res.json();
}

export async function fetchTask(id) {
  const res = await fetch(`${API_BASE}/tasks/${id}`);
  if (!res.ok) throw new Error('단건 조회 실패');
  return res.json();
}

export async function updateTask(id, data) {
  const res = await fetch(`${API_BASE}/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || '수정 실패');
  }
  return res.json();
}

export async function deleteTask(id) {
  const res = await fetch(`${API_BASE}/tasks/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('삭제 실패');
}
