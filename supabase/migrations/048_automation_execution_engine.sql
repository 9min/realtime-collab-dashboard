-- 자동화 규칙 실행 엔진
-- tasks INSERT/UPDATE 시 해당 프로젝트의 활성 자동화 규칙을 평가하고 실행

CREATE OR REPLACE FUNCTION execute_automation_rules()
RETURNS TRIGGER AS $$
DECLARE
  rule RECORD;
  should_fire BOOLEAN;
  action_result JSONB;
  trigger_data JSONB;
  notification_message TEXT;
BEGIN
  -- 재귀 방지: 자동화 액션이 tasks를 수정하면 다시 트리거되는 것을 방지
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  -- 해당 프로젝트의 활성 자동화 규칙을 순회
  FOR rule IN
    SELECT * FROM automation_rules
    WHERE project_id = NEW.project_id
      AND is_active = true
  LOOP
    should_fire := false;
    trigger_data := '{}'::JSONB;

    -- ── 트리거 조건 평가 ──

    -- 1. task_created: INSERT 시에만
    IF rule.trigger_type = 'task_created' AND TG_OP = 'INSERT' THEN
      should_fire := true;
      trigger_data := jsonb_build_object('task_title', NEW.title);
    END IF;

    -- 2. task_moved_to_column: column_id 변경 시
    IF rule.trigger_type = 'task_moved_to_column' AND TG_OP = 'UPDATE' THEN
      IF OLD.column_id IS DISTINCT FROM NEW.column_id THEN
        -- trigger_config.column_id가 지정되어 있으면 해당 컬럼으로 이동했을 때만 발동
        IF rule.trigger_config ? 'column_id' THEN
          IF NEW.column_id::TEXT = rule.trigger_config->>'column_id' THEN
            should_fire := true;
          END IF;
        ELSE
          should_fire := true;
        END IF;

        IF should_fire THEN
          trigger_data := jsonb_build_object(
            'task_title', NEW.title,
            'from_column_id', OLD.column_id,
            'to_column_id', NEW.column_id
          );
        END IF;
      END IF;
    END IF;

    -- 3. priority_changed: priority 변경 시
    IF rule.trigger_type = 'priority_changed' AND TG_OP = 'UPDATE' THEN
      IF OLD.priority IS DISTINCT FROM NEW.priority THEN
        should_fire := true;

        -- from_priority 필터
        IF rule.trigger_config ? 'from_priority'
           AND rule.trigger_config->>'from_priority' <> ''
           AND OLD.priority::TEXT <> rule.trigger_config->>'from_priority' THEN
          should_fire := false;
        END IF;

        -- to_priority 필터
        IF rule.trigger_config ? 'to_priority'
           AND rule.trigger_config->>'to_priority' <> ''
           AND NEW.priority::TEXT <> rule.trigger_config->>'to_priority' THEN
          should_fire := false;
        END IF;

        IF should_fire THEN
          trigger_data := jsonb_build_object(
            'task_title', NEW.title,
            'from_priority', OLD.priority,
            'to_priority', NEW.priority
          );
        END IF;
      END IF;
    END IF;

    -- 4. assignee_changed: assignee_id 변경 시
    IF rule.trigger_type = 'assignee_changed' AND TG_OP = 'UPDATE' THEN
      IF OLD.assignee_id IS DISTINCT FROM NEW.assignee_id THEN
        should_fire := true;
        trigger_data := jsonb_build_object(
          'task_title', NEW.title,
          'from_assignee', OLD.assignee_id,
          'to_assignee', NEW.assignee_id
        );
      END IF;
    END IF;

    -- ── 액션 실행 ──
    IF should_fire THEN
      action_result := '{}'::JSONB;

      BEGIN
        -- set_priority
        IF rule.action_type = 'set_priority' AND rule.action_config ? 'priority' THEN
          UPDATE tasks
          SET priority = (rule.action_config->>'priority')::task_priority,
              updated_at = now()
          WHERE id = NEW.id;

          action_result := jsonb_build_object(
            'previous_priority', NEW.priority,
            'new_priority', rule.action_config->>'priority'
          );

          -- 현재 트리거의 NEW도 업데이트
          NEW.priority := (rule.action_config->>'priority')::task_priority;
        END IF;

        -- move_to_column
        IF rule.action_type = 'move_to_column' AND rule.action_config ? 'column_id' THEN
          UPDATE tasks
          SET column_id = (rule.action_config->>'column_id')::UUID,
              updated_at = now()
          WHERE id = NEW.id;

          action_result := jsonb_build_object(
            'from_column_id', NEW.column_id,
            'to_column_id', rule.action_config->>'column_id'
          );
        END IF;

        -- send_notification: 프로젝트 멤버 전원에게 알림
        IF rule.action_type = 'send_notification' THEN
          notification_message := COALESCE(
            rule.action_config->>'message',
            '자동화 규칙 "' || rule.name || '"이 실행되었습니다'
          );

          INSERT INTO notifications (project_id, user_id, actor_id, type, title, message, entity_type, entity_id, is_read)
          SELECT
            NEW.project_id,
            pm.user_id,
            NEW.created_by,
            'automation',
            rule.name,
            notification_message || ' — ' || NEW.title,
            'task',
            NEW.id,
            false
          FROM project_members pm
          WHERE pm.project_id = NEW.project_id;

          action_result := jsonb_build_object('notification_sent', true, 'message', notification_message);
        END IF;

        -- 실행 로그 기록
        INSERT INTO automation_executions (rule_id, project_id, trigger_entity_id, trigger_data, action_result, status)
        VALUES (rule.id, NEW.project_id, NEW.id, trigger_data, action_result, 'success');

        -- 규칙 카운터 업데이트
        UPDATE automation_rules
        SET execution_count = execution_count + 1,
            last_executed_at = now()
        WHERE id = rule.id;

      EXCEPTION WHEN OTHERS THEN
        -- 에러 시 원본 작업을 차단하지 않고 로그만 기록
        INSERT INTO automation_executions (rule_id, project_id, trigger_entity_id, trigger_data, action_result, status, error_message)
        VALUES (rule.id, NEW.project_id, NEW.id, trigger_data, '{}'::JSONB, 'error', SQLERRM);
      END;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- tasks 테이블에 트리거 연결
CREATE TRIGGER trg_execute_automation_on_task_insert
  AFTER INSERT ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION execute_automation_rules();

CREATE TRIGGER trg_execute_automation_on_task_update
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION execute_automation_rules();
