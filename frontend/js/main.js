import state from './state.js';
import { fetchTasks, createTask, fetchTask, updateTask, deleteTask } from './api.js';

// ── 유틸 ──────────────────────────────────────────────

function escapeHtml(str) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(str ?? ''));
  return d.innerHTML;
}

function toLocalInput(utcStr) {
  if (!utcStr) return '';
  const d = new Date(utcStr);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toIsoString(localStr) {
  if (!localStr) return null;
  return new Date(localStr).toISOString();
}

function formatDueAt(dueAtStr) {
  if (!dueAtStr) return null;
  const due = new Date(dueAtStr);
  const now = new Date();
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((dueDay - today) / 86400000);
  const h = String(due.getHours()).padStart(2, '0');
  const m = String(due.getMinutes()).padStart(2, '0');
  const time = `${h}:${m}`;
  const overdue = due < now;

  if (diffDays > 0) return { text: `D-${diffDays} ${time}`, overdue: false };
  if (diffDays === 0) return { text: `D-0 ${time}`, overdue };
  return { text: `D+${Math.abs(diffDays)} ${time}`, overdue: true };
}

const STATUS_BADGE = {
  todo:        'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
  in_progress: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
  done:        'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
};
const STATUS_LABEL = { todo: 'Todo', in_progress: 'In Progress', done: 'Done' };

// ── 렌더링 ────────────────────────────────────────────

function renderTaskList() {
  const list = document.getElementById('task-list');
  const empty = document.getElementById('empty-msg');
  list.innerHTML = '';

  if (state.tasks.length === 0) {
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');
  state.tasks.forEach(task => list.appendChild(buildCard(task)));
}

const STATUS_BTN_ACTIVE = {
  todo:        'bg-gray-400 dark:bg-gray-500 text-white font-semibold',
  in_progress: 'bg-blue-500 text-white font-semibold',
  done:        'bg-green-500 text-white font-semibold',
};
const STATUS_BTN_INACTIVE = 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600';

function buildCard(task) {
  const due = formatDueAt(task.due_at);
  const card = document.createElement('div');
  card.dataset.taskId = task.id;
  card.className =
    'bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-xl shadow-lg p-4 cursor-pointer hover:shadow-xl transition-shadow';

  const statusBtns = ['todo', 'in_progress', 'done'].map(s => {
    const cls = s === task.status ? STATUS_BTN_ACTIVE[s] : STATUS_BTN_INACTIVE;
    return `<button class="status-btn flex-1 min-h-[44px] text-xs rounded-lg transition-colors ${cls}" data-status="${s}">
      ${escapeHtml(STATUS_LABEL[s])}
    </button>`;
  }).join('');

  card.innerHTML = `
    <div class="space-y-2">
      <div class="flex items-start gap-2">
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium">${escapeHtml(task.title)}</p>
          ${task.description
            ? `<p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">${escapeHtml(task.description)}</p>`
            : ''}
          ${due
            ? `<p class="text-xs mt-0.5 ${due.overdue ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'}">${due.text}</p>`
            : ''}
        </div>
        <button
          class="delete-btn min-h-[44px] min-w-[44px] flex items-center justify-center -mr-1 -mt-1 text-gray-300 hover:text-red-400 dark:text-gray-600 dark:hover:text-red-400 transition-colors flex-shrink-0 text-lg"
          aria-label="삭제">🗑</button>
      </div>
      <div class="flex gap-1.5">${statusBtns}</div>
    </div>
  `;

  card.addEventListener('click', e => {
    if (!e.target.closest('.delete-btn') && !e.target.closest('.status-btn')) openEditModal(task.id);
  });
  card.querySelector('.delete-btn').addEventListener('click', e => {
    e.stopPropagation();
    openConfirmModal(task.id);
  });
  card.querySelectorAll('.status-btn').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      const newStatus = btn.dataset.status;
      if (newStatus === task.status) return;
      try {
        const updated = await updateTask(task.id, { status: newStatus });
        state.tasks = state.tasks.map(t => t.id === task.id ? updated : t);
        renderTaskList();
      } catch (err) {
        alert(err.message);
      }
    });
  });

  return card;
}

// ── 추가 폼 ───────────────────────────────────────────

document.getElementById('add-form').addEventListener('submit', async e => {
  e.preventDefault();
  const title = document.getElementById('form-title').value.trim();
  const description = document.getElementById('form-description').value.trim() || null;
  const dueAt = document.getElementById('form-due-at').value;
  const status = document.getElementById('form-status').value;
  const errEl = document.getElementById('add-error');

  if (!title) {
    errEl.textContent = '업무 제목을 입력해주세요.';
    errEl.classList.remove('hidden');
    return;
  }
  errEl.classList.add('hidden');

  const payload = { title, description, status };
  if (dueAt) payload.due_at = toIsoString(dueAt);

  try {
    const task = await createTask(payload);
    state.tasks.unshift(task);
    renderTaskList();
    e.target.reset();
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.remove('hidden');
  }
});

// ── 수정 모달 ─────────────────────────────────────────

async function openEditModal(taskId) {
  try {
    const task = await fetchTask(taskId);
    document.getElementById('edit-id').value = task.id;
    document.getElementById('edit-title').value = task.title;
    document.getElementById('edit-description').value = task.description ?? '';
    document.getElementById('edit-due-at').value = toLocalInput(task.due_at);
    document.getElementById('edit-status').value = task.status;
    document.getElementById('edit-error').classList.add('hidden');
    document.getElementById('edit-modal').classList.remove('hidden');
    document.getElementById('edit-title').focus();
  } catch (err) {
    alert(err.message);
  }
}

function closeEditModal() {
  document.getElementById('edit-modal').classList.add('hidden');
}

function confirmClose() {
  if (confirm('변경사항이 저장되지 않습니다. 닫을까요?')) closeEditModal();
}

document.getElementById('modal-backdrop').addEventListener('click', confirmClose);
document.getElementById('edit-cancel').addEventListener('click', closeEditModal);

document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  const confirmModal = document.getElementById('confirm-modal');
  const editModal = document.getElementById('edit-modal');
  if (!confirmModal.classList.contains('hidden')) {
    closeConfirmModal();
  } else if (!editModal.classList.contains('hidden')) {
    confirmClose();
  }
});

document.getElementById('edit-form').addEventListener('submit', async e => {
  e.preventDefault();
  const id = Number(document.getElementById('edit-id').value);
  const title = document.getElementById('edit-title').value.trim();
  const description = document.getElementById('edit-description').value.trim() || null;
  const dueAt = document.getElementById('edit-due-at').value;
  const status = document.getElementById('edit-status').value;
  const errEl = document.getElementById('edit-error');

  if (!title) {
    errEl.textContent = '업무 제목을 입력해주세요.';
    errEl.classList.remove('hidden');
    return;
  }
  errEl.classList.add('hidden');

  const payload = { title, description, status, due_at: dueAt ? toIsoString(dueAt) : null };

  try {
    const updated = await updateTask(id, payload);
    state.tasks = state.tasks.map(t => t.id === id ? updated : t);
    renderTaskList();
    closeEditModal();
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.remove('hidden');
  }
});

// ── 삭제 확인 다이얼로그 ────────────────────────────────

let pendingDeleteId = null;

function openConfirmModal(taskId) {
  pendingDeleteId = taskId;
  document.getElementById('confirm-modal').classList.remove('hidden');
}

function closeConfirmModal() {
  pendingDeleteId = null;
  document.getElementById('confirm-modal').classList.add('hidden');
}

document.getElementById('confirm-cancel').addEventListener('click', closeConfirmModal);
document.getElementById('confirm-ok').addEventListener('click', async () => {
  if (pendingDeleteId === null) return;
  const id = pendingDeleteId;
  closeConfirmModal();
  try {
    await deleteTask(id);
    state.tasks = state.tasks.filter(t => t.id !== id);
    renderTaskList();
  } catch (err) {
    alert(err.message);
  }
});

// ── 테마 토글 ─────────────────────────────────────────

function syncThemeIcon() {
  document.getElementById('theme-icon').textContent =
    document.documentElement.classList.contains('dark') ? '☀️' : '🌙';
}

document.getElementById('theme-toggle').addEventListener('click', () => {
  document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  syncThemeIcon();
});

// ── 초기화 & 폴링 ─────────────────────────────────────

async function loadTasks() {
  try {
    state.tasks = await fetchTasks();
    renderTaskList();
  } catch (_err) {
    // 서버 미실행 시 무시
  }
}

syncThemeIcon();
loadTasks();
setInterval(loadTasks, 3000);
