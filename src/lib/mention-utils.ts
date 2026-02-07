import type { Tables } from '@/types/database'

interface MemberInfo {
  user_id: string
  profiles: Tables<'profiles'>
}

/**
 * 댓글 텍스트에서 @멘션을 파싱하여 user_id 배열 반환
 * @display_name 패턴을 찾아 members에서 매칭
 */
export function parseMentions(text: string, members: MemberInfo[]): string[] {
  const mentionPattern = /@([^\s@]+(?:\s[^\s@]+)?)/g
  const mentionedIds: string[] = []
  let match: RegExpExecArray | null

  while ((match = mentionPattern.exec(text)) !== null) {
    const mentionText = match[1]
    const member = members.find((m) => {
      const name = m.profiles.full_name ?? m.profiles.email
      return name === mentionText
    })
    if (member && !mentionedIds.includes(member.user_id)) {
      mentionedIds.push(member.user_id)
    }
  }

  return mentionedIds
}

/**
 * 텍스트 내 @멘션 부분을 하이라이트 표시할 수 있도록 세그먼트 배열 반환
 */
export interface MentionSegment {
  type: 'text' | 'mention'
  content: string
  userId?: string
}

export function parseMentionSegments(text: string, members: MemberInfo[]): MentionSegment[] {
  const memberNames = members.map((m) => ({
    name: m.profiles.full_name ?? m.profiles.email,
    userId: m.user_id,
  }))

  // 이름 길이 내림차순 정렬 (긴 이름 먼저 매칭)
  memberNames.sort((a, b) => b.name.length - a.name.length)

  const segments: MentionSegment[] = []
  let remaining = text

  while (remaining.length > 0) {
    let earliestIndex = -1
    let matchedName = ''
    let matchedUserId = ''

    for (const { name, userId } of memberNames) {
      const pattern = `@${name}`
      const idx = remaining.indexOf(pattern)
      if (idx !== -1 && (earliestIndex === -1 || idx < earliestIndex)) {
        earliestIndex = idx
        matchedName = name
        matchedUserId = userId
      }
    }

    if (earliestIndex === -1) {
      segments.push({ type: 'text', content: remaining })
      break
    }

    if (earliestIndex > 0) {
      segments.push({ type: 'text', content: remaining.slice(0, earliestIndex) })
    }

    segments.push({ type: 'mention', content: `@${matchedName}`, userId: matchedUserId })
    remaining = remaining.slice(earliestIndex + matchedName.length + 1)
  }

  return segments
}
