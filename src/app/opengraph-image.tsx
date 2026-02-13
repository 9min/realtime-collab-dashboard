import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = '실시간 협업 일정관리 도구'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%)',
          padding: '60px 80px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* 상단 장식 바 */}
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '5px',
            background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)',
            borderRadius: '2px',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        />

        {/* 칸반 카드들 (배경 장식) */}
        <div style={{ display: 'flex', gap: '24px', position: 'absolute', top: '60px', right: '80px', opacity: 0.12 }}>
          {/* 칼럼 1 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '140px' }}>
            <div style={{ background: '#3b82f6', borderRadius: '10px', height: '80px', width: '100%' }} />
            <div style={{ background: '#3b82f6', borderRadius: '10px', height: '60px', width: '100%' }} />
            <div style={{ background: '#3b82f6', borderRadius: '10px', height: '100px', width: '100%' }} />
          </div>
          {/* 칼럼 2 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '140px' }}>
            <div style={{ background: '#8b5cf6', borderRadius: '10px', height: '100px', width: '100%' }} />
            <div style={{ background: '#8b5cf6', borderRadius: '10px', height: '70px', width: '100%' }} />
          </div>
          {/* 칼럼 3 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '140px' }}>
            <div style={{ background: '#10b981', borderRadius: '10px', height: '60px', width: '100%' }} />
            <div style={{ background: '#10b981', borderRadius: '10px', height: '90px', width: '100%' }} />
            <div style={{ background: '#10b981', borderRadius: '10px', height: '70px', width: '100%' }} />
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, zIndex: 1 }}>
          {/* 로고/아이콘 영역 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '32px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '56px',
                height: '56px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </div>
            <span style={{ fontSize: '24px', color: '#475569', fontWeight: 600, letterSpacing: '0.05em' }}>
              mini-flow
            </span>
          </div>

          {/* 타이틀 */}
          <h1
            style={{
              fontSize: '52px',
              fontWeight: 800,
              color: '#0f172a',
              lineHeight: 1.2,
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            실시간 협업
            <br />
            일정관리 도구
          </h1>

          {/* 설명 */}
          <p
            style={{
              fontSize: '22px',
              color: '#64748b',
              marginTop: '20px',
              lineHeight: 1.5,
            }}
          >
            칸반 보드 · 실시간 동기화 · 팀 협업
          </p>

          {/* 하단 태그들 */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '40px' }}>
            {['칸반 보드', '대시보드', '실시간 알림', '팀 관리'].map((tag) => (
              <div
                key={tag}
                style={{
                  display: 'flex',
                  padding: '8px 18px',
                  borderRadius: '20px',
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  color: '#3b82f6',
                  fontSize: '15px',
                  fontWeight: 500,
                }}
              >
                {tag}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
