-- ============================================
-- Fix: 누락된 profiles 백필 + 트리거 재설정
-- ============================================
-- 문제: auth.users에 유저가 있으나 profiles에 row가 없음
--       → projects.owner_id FK 제약조건 위반 (23503)
-- 원인: 트리거 생성 전에 가입했거나, 트리거 실행 실패
-- 해결: 기존 유저 백필 + 트리거 재생성

-- 1. 기존 auth.users 중 profiles에 없는 유저 백필
INSERT INTO profiles (id, email, full_name, avatar_url)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', ''),
  COALESCE(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture', '')
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- 2. 트리거 함수 재생성 (OAuth provider별 메타데이터 키 대응)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 트리거 재설정
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
