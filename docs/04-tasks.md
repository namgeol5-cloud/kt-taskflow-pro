# 04-tasks — MVP 개발 로드맵

## 진행 규칙

- **순서대로만** 진행한다. 이전 단계의 검증이 끝나야 다음 단계로 넘어간다.
- **병렬 진행 금지** — 단계가 겹치면 검증 기준이 무너진다.
- **단계별 검증 필수** — 검증 방법을 실행하고 통과해야 해당 단계를 완료로 선언한다.

---

## Phase 1 — 설계 ✅ 완료

> CLAUDE.md + docs/ 6종 작성

| # | 작업 | 검증 방법 |
|---|---|---|
| 1 | `CLAUDE.md` 작성 (역할·규칙·응답 형식) | 파일 존재 확인, 절대 규칙 5개 포함 여부 육안 확인 |
| 2 | `docs/` 폴더 생성 | `docs/` 디렉토리 존재 확인 |
| 3 | `docs/00-overview.md` 작성 | 매핑표·읽는 순서·분리 원칙 포함 여부 확인 |
| 4 | `docs/01-product.md` 작성 | 목표·페르소나·MVP 범위·성공 기준 포함 여부 확인 |
| 5 | `docs/02-specs.md` 작성 | Task 모델·API 5개·검증 규칙·화면 명세 포함 여부 확인 |
| 6 | `docs/03-design.md` 작성 | 설계 결정 8선·의존성 추가 정책 포함 여부 확인 |
| 7 | `docs/04-tasks.md` 작성 (현재 파일) | Phase 3개·체크리스트·검증 방법 포함 여부 확인 |
| 8 | `docs/05-conventions.md` 작성 | 네이밍·폴더 구조·커밋 컨벤션·환경변수 정책 포함 여부 확인 |
| 9 | 전체 docs 파일 상호 참조 이상 없음 확인 | 각 파일 내 파일명 링크·참조 일치 여부 수동 확인 |
| 10 | git commit & push — Phase 1 완료 태그 | GitHub 저장소에서 커밋 이력 확인 |

---

## Phase 2 — 백엔드

> `backend/` 디렉토리, FastAPI, CRUD API 5개, Swagger 확인

| # | 작업 | 검증 방법 |
|---|---|---|
| 1 | `backend/` 폴더 구조 생성 (`app/`, `tests/`) | 디렉토리 트리 확인 |
| 2 | `requirements.txt` 작성 (FastAPI, Uvicorn, SQLAlchemy, pytest 등) | `pip install -r requirements.txt` 오류 없음 |
| 3 | `.env.example` 작성 및 `.gitignore` 에 `.env` 추가 | `.env` 가 git 추적 대상 아님 확인 (`git status`) |
| 4 | SQLAlchemy `Task` 모델 작성 (`02-specs.md` 필드 기준) | Python import 오류 없음 |
| 5 | DB 초기화 스크립트 작성 (SQLite → 테이블 자동 생성) | 서버 실행 후 `taskflow.db` 파일 생성 확인 |
| 6 | `POST /api/tasks` 구현 | curl 또는 Swagger에서 `201` 응답 확인 |
| 7 | `GET /api/tasks`, `GET /api/tasks/:id` 구현 | 목록 응답에 `description` 제외, 단건에 포함 확인 |
| 8 | `PUT /api/tasks/:id` 구현 (부분 수정) | 일부 필드만 보내도 나머지 유지됨 확인 |
| 9 | `DELETE /api/tasks/:id` 구현 | `204 No Content` 응답 확인, 재조회 시 `404` 확인 |
| 10 | pytest 유닛 테스트 작성 및 전체 통과 확인 | `pytest` 실행 후 모든 테스트 `PASSED` |

---

## Phase 3 — 프론트엔드

> `frontend/` 디렉토리, HTML + Vanilla JS + Tailwind CDN, 메인 화면, API 연결, git push

| # | 작업 | 검증 방법 |
|---|---|---|
| 1 | `frontend/` 폴더 구조 생성 (`index.html`, `js/`, `css/`) | 디렉토리 트리 확인 |
| 2 | `index.html` 기본 레이아웃 작성 (Tailwind CDN, 시스템폰트, macOS 톤) | 브라우저 열어 빈 화면 깨짐 없음 확인 |
| 3 | 라이트/다크 테마 토글 구현 (`localStorage`, `prefers-color-scheme` 초기값) | 토글 클릭 전환 확인, 새로고침 후 유지 확인 |
| 4 | 업무 추가 폼 구현 (`title` / `due_at` / `status` 입력, `POST` 호출) | 폼 제출 후 `201` 응답 확인, 목록에 즉시 반영 |
| 5 | 업무 목록 카드 렌더링 (`status` 배지, D-N HH:MM 카운트다운) | 카드 정상 표시, 마감 초과 시 붉은색 확인 |
| 6 | 수정 모달 구현 (카드 클릭 → 모달, `PUT` 호출, ESC/외부 클릭 닫기) | 수정 저장 후 카드 즉시 갱신 확인 |
| 7 | 삭제 구현 (휴지통 아이콘 → 확인 다이얼로그 → `DELETE` 호출) | 삭제 후 카드 즉시 제거 확인 |
| 8 | 360px 반응형 확인 및 전체 성공 기준 점검, git commit & push | Chrome DevTools 360px 뷰포트에서 레이아웃 깨짐 없음, API 응답 200ms 이하 확인 |
