# 삭제 기능 수동 테스트 가이드

프로젝트/태스크 삭제 시 DB 레코드와 Storage 파일이 모두 정리되는지 확인하는 절차.

---

## 사전 준비

1. Supabase Dashboard 접속 (로컬 또는 클라우드)
2. 테스트용 프로젝트 생성
3. 해당 프로젝트에 태스크 1~2개 생성
4. 태스크에 첨부파일 1~2개 업로드

---

## 테스트 1: 태스크 삭제 시 Storage 정리

### 삭제 전 확인

1. **Database** > `task_attachments` 테이블
   - 해당 태스크의 첨부파일 레코드 존재 확인
   - `file_path` 값 메모

2. **Storage** > `task-attachments` 버킷
   - `file_path`에 해당하는 파일이 존재하는지 확인

### 삭제 실행

1. 앱에서 태스크 상세 다이얼로그 열기
2. **삭제** 버튼 클릭
3. AlertDialog에서 **삭제** 확인

### 삭제 후 확인

1. **Database** > `task_attachments` 테이블
   - 해당 태스크의 레코드가 삭제됨 (CASCADE)

2. **Storage** > `task-attachments` 버킷
   - 해당 파일이 삭제됨

---

## 테스트 2: 프로젝트 삭제 시 Storage 정리

### 삭제 전 확인

1. **Database** > `tasks` 테이블
   - 해당 프로젝트의 태스크 존재 확인

2. **Database** > `task_attachments` 테이블
   - 해당 프로젝트의 첨부파일 레코드 존재 확인

3. **Storage** > `task-attachments` 버킷
   - `{project_id}/` 경로에 파일 존재 확인

### 삭제 실행

1. 프로젝트 목록 페이지에서 프로젝트 카드의 `...` 메뉴 클릭
2. **삭제** 클릭
3. AlertDialog에서 **삭제** 확인

### 삭제 후 확인

1. **Database** 확인 (모두 CASCADE 삭제됨):
   - `projects` — 해당 프로젝트 레코드 없음
   - `tasks` — 해당 프로젝트의 태스크 없음
   - `task_attachments` — 해당 프로젝트의 첨부파일 레코드 없음
   - `project_members` — 해당 프로젝트의 멤버 없음
   - `kanban_columns` — 해당 프로젝트의 컬럼 없음

2. **Storage** > `task-attachments` 버킷
   - `{project_id}/` 경로의 모든 파일이 삭제됨

---

## 예상 결과 요약

| 삭제 대상 | DB 레코드 | Storage 파일 |
|-----------|----------|-------------|
| 태스크 | CASCADE 삭제 | 서비스 레이어에서 삭제 |
| 프로젝트 | CASCADE 삭제 | 서비스 레이어에서 삭제 |

Storage 삭제 실패 시에도 DB 삭제는 정상 진행됨 (warning 수준 처리).
