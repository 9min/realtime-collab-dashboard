-- ============================================
-- Fix: handle_new_user 트리거 — 스키마 경로 + NULL 안전 + upsert
-- ============================================
-- 문제 1: SECURITY DEFINER 함수에서 search_path가 달라 profiles 테이블을 찾지 못함
-- 문제 2: 새 Google 계정 로그인 시 프로필 INSERT 충돌로 auth.users INSERT까지 롤백
-- 문제 3: email이 NULL일 수 있음
-- 해결: public 스키마 명시 + SET search_path + ON CONFLICT upsert + COALESCE

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, public.profiles.email),
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.profiles.full_name),
    avatar_url = COALESCE(NULLIF(EXCLUDED.avatar_url, ''), public.profiles.avatar_url),
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
