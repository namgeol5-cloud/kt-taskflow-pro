# 05-conventions — 코드 컨벤션

## 명명 규칙

| 구분 | 방식 | 예시 |
|---|---|---|
| 백엔드 변수·함수·파일 | `snake_case` | `task_id`, `get_task_by_id`, `task_router.py` |
| 프론트엔드 변수·함수 | `camelCase` | `taskId`, `getTaskById`, `renderCard` |
| 프론트엔드 컴포넌트 | `PascalCase` | `TaskCard`, `ModalDialog`, `ThemeToggle` |
| 클래스 (Python) | `PascalCase` | `TaskService`, `TaskSchema` |
| 상수 | `UPPER_SNAKE_CASE` | `MAX_TITLE_LENGTH`, `DEFAULT_STATUS` |
| DB 컬럼·테이블 | `snake_case` | `due_at`, `created_at`, `task` |

**식별자는 반드시 영어**로 작성한다. **주석만 한국어**로 작성한다.

```python
# 마감 시각이 없으면 None 반환 — 한국어 주석 허용
def get_due_at(task: Task) -> datetime | None:
    return task.due_at
```

---

## 금지 목록

| 금지 | 이유 | 대안 |
|---|---|---|
| `print` 디버깅 | 운영 환경에 노이즈 유발, 로그 추적 불가 | `logging` 모듈 사용 (`logger.debug`, `logger.info`) |
| `bare except` | 모든 예외를 삼켜 원인 추적 불가 | `except SpecificError as e:` 로 명시적 처리 |
| 비밀번호·API 키 하드코딩 | 코드 유출 시 즉각 보안 사고 | `.env` 파일 + `os.getenv("KEY")` |
| TypeScript `any` 타입 | 타입 시스템 의미 상실, 런타임 오류 미탐지 | 명시적 타입 또는 `unknown` + 타입 가드 |
| CSS `!important` | 우선순위 충돌 시 디버깅 불가 | 셀렉터 구체성 개선 또는 Tailwind 유틸리티 클래스 활용 |

---

## 테스트 규칙

- 테스트 프레임워크: `pytest`
- 모든 API 엔드포인트에 대해 아래 케이스를 **반드시** 작성한다.

| 케이스 | 설명 |
|---|---|
| 정상 (Happy path) | 올바른 요청 → 기대 응답 코드·바디 확인 |
| `400 Bad Request` | 필수 필드 누락, 형식 위반 요청 |
| `404 Not Found` | 존재하지 않는 `id` 로 요청 |

```python
# 예시 구조
def test_create_task_success(): ...
def test_create_task_missing_title(): ...      # 400
def test_get_task_not_found(): ...             # 404
```

테스트 파일 위치: `backend/tests/test_<모듈명>.py`
테스트 없이 완료를 선언하지 않는다. (절대 규칙 3번)

---

## Git 커밋 컨벤션

### 타입 prefix

| 타입 | 사용 시점 |
|---|---|
| `feat` | 새 기능 추가 |
| `fix` | 버그 수정 |
| `docs` | 문서 작성·수정 |
| `refactor` | 동작 변경 없는 코드 개선 |
| `test` | 테스트 추가·수정 |
| `chore` | 빌드·설정·의존성 변경 |

### 형식

```
<타입>: <한국어 요약 (50자 이내)>

예)
feat: Task 생성 API 추가
fix: due_at 시간대 변환 오류 수정
docs: 03-design.md 설계 결정 8선 작성
test: Task CRUD 400·404 케이스 테스트 추가
```

- 요약은 **한국어**로 작성한다.
- 명령형으로 작성한다 ("추가했다" ❌ → "추가" ✅).
- 제목 끝에 마침표를 붙이지 않는다.
