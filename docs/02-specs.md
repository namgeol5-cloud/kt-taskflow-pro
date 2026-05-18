# 02-specs — 기술 명세

## Task 모델

### 필드 정의

| 필드 | 타입 | 필수 | 기본값 | 설명 |
|---|---|---|---|---|
| `id` | INTEGER (PK, AUTO) | — | 자동 | 고유 식별자 |
| `title` | VARCHAR(200) | ✅ | — | 업무 제목 |
| `description` | TEXT | ❌ | NULL | 업무 상세 설명 |
| `status` | ENUM | ✅ | `todo` | `todo` / `in_progress` / `done` |
| `due_at` | DATETIME (UTC) | ❌ | NULL | 마감 시각 |
| `created_at` | DATETIME (UTC) | — | 자동 | 생성 시각 |
| `updated_at` | DATETIME (UTC) | — | 자동 | 최종 수정 시각 |

### 상태 전이

```
todo  →  in_progress  →  done
  ↑___________________________↓  (되돌리기 허용)
```

---

## 검증 규칙

| 조건 | 응답 |
|---|---|
| `title` 누락 또는 빈 문자열 | `400 Bad Request` |
| `status` 가 `todo / in_progress / done` 외 값 | `400 Bad Request` |
| `due_at` 가 ISO 8601 형식이 아닌 경우 | `400 Bad Request` |
| 존재하지 않는 `id` 로 조회·수정·삭제 요청 | `404 Not Found` |

`due_at` 허용 형식 예시: `2026-05-12T18:00:00Z`, `2026-05-12T18:00:00+09:00`
서버는 수신 즉시 UTC로 변환하여 저장한다.

---

## REST API

### 엔드포인트 목록

| 메서드 | 경로 | 응답 코드 | 설명 |
|---|---|---|---|
| `POST` | `/api/tasks` | `201 Created` | 업무 생성 |
| `GET` | `/api/tasks` | `200 OK` | 업무 목록 조회 |
| `GET` | `/api/tasks/:id` | `200 OK` | 업무 단건 조회 |
| `PUT` | `/api/tasks/:id` | `200 OK` | 업무 수정 (부분 수정 허용) |
| `DELETE` | `/api/tasks/:id` | `204 No Content` | 업무 삭제 |

### 응답 필드 규칙

| 필드 | 목록 (`GET /api/tasks`) | 단건 (`GET /api/tasks/:id`) |
|---|---|---|
| `id` | ✅ | ✅ |
| `title` | ✅ | ✅ |
| `description` | ❌ 제외 | ✅ 포함 |
| `status` | ✅ | ✅ |
| `due_at` | ✅ | ✅ |
| `created_at` | ✅ | ✅ |
| `updated_at` | ✅ | ✅ |

### 요청/응답 예시

**POST `/api/tasks`**
```json
// Request
{
  "title": "디자인 시안 검토",
  "description": "Figma 링크 확인 후 피드백 작성",
  "status": "todo",
  "due_at": "2026-05-12T18:00:00Z"
}

// Response 201
{
  "id": 1,
  "title": "디자인 시안 검토",
  "description": "Figma 링크 확인 후 피드백 작성",
  "status": "todo",
  "due_at": "2026-05-12T18:00:00Z",
  "created_at": "2026-05-18T09:00:00Z",
  "updated_at": "2026-05-18T09:00:00Z"
}
```

**GET `/api/tasks`** — `description` 제외
```json
// Response 200
[
  {
    "id": 1,
    "title": "디자인 시안 검토",
    "status": "todo",
    "due_at": "2026-05-12T18:00:00Z",
    "created_at": "2026-05-18T09:00:00Z",
    "updated_at": "2026-05-18T09:00:00Z"
  }
]
```

**PUT `/api/tasks/:id`** — 부분 수정 허용 (보내지 않은 필드는 기존값 유지)
```json
// Request
{ "status": "in_progress" }

// Response 200
{
  "id": 1,
  "title": "디자인 시안 검토",
  "description": "Figma 링크 확인 후 피드백 작성",
  "status": "in_progress",
  "due_at": "2026-05-12T18:00:00Z",
  "created_at": "2026-05-18T09:00:00Z",
  "updated_at": "2026-05-18T10:30:00Z"
}
```

**DELETE `/api/tasks/:id`** — 본문 없음, `204 No Content`

### 오류 응답 형식

```json
// 400
{ "error": "title is required" }

// 404
{ "error": "task not found" }
```

---

## 화면 명세 (CRUD 4종)

### 1. 추가 — 업무 생성 폼

- 항상 화면 상단 또는 FAB(+) 버튼으로 접근
- 입력 필드: `title` (필수) / `due_at` (날짜+시간 picker) / `status` (select, 기본 `todo`)
- 제출 시 `POST /api/tasks` 호출 → 성공하면 목록에 즉시 반영

### 2. 목록 — 업무 카드 리스트

- 카드마다 표시:
  - `title`
  - `status` 배지 (색상 구분: `todo` 회색 / `in_progress` 파랑 / `done` 초록)
  - 마감 카운트다운: **D-N HH:MM** 형식
    - 예: `D-3 18:00` → 3일 후 18시 마감
    - 당일: `D-0 18:00`
    - 초과: `D+2 18:00` (붉은색 표시)
  - `description` 은 목록 카드에서 노출하지 않음

### 3. 수정 — 카드 클릭 → 모달

- 카드 클릭 시 모달 오픈
- 모달 안에서 `title` / `description` / `due_at` / `status` 수정 가능
- 저장 버튼 클릭 시 `PUT /api/tasks/:id` 호출
- 모달 외부 클릭 또는 ESC 키로 닫기 (변경사항 미저장 경고)

### 4. 삭제 — 휴지통 아이콘 → 확인 → DELETE

- 카드 우측 상단 휴지통(🗑) 아이콘
- 클릭 시 확인 다이얼로그: "정말 삭제할까요?"
- 확인 시 `DELETE /api/tasks/:id` 호출 → 성공하면 목록에서 즉시 제거
