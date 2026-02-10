import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'

import { renderWithProviders } from '@/__tests__/helpers/render-with-providers'

import { UserAvatar } from './user-avatar'

describe('UserAvatar', () => {
  it('이미지 URL이 있을 때 아바타를 렌더링한다', () => {
    const { container } = renderWithProviders(
      <UserAvatar name="John" avatarUrl="https://example.com/avatar.jpg" showTooltip={false} />,
    )

    // Radix Avatar does not render the <img> in jsdom (image never loads).
    // Verify the avatar container is rendered with correct structure.
    const avatar = container.querySelector('[data-slot="avatar"]')
    expect(avatar).toBeInTheDocument()
    // Fallback is shown because jsdom can't load images
    expect(screen.getByText('JO')).toBeInTheDocument()
  })

  it('이미지가 없을 때 이니셜 폴백을 표시한다', () => {
    renderWithProviders(
      <UserAvatar name="John Doe" avatarUrl={null} showTooltip={false} />,
    )

    // getInitials returns first 2 chars uppercased: "JO"
    expect(screen.getByText('JO')).toBeInTheDocument()
  })

  it('name이 null이면 ? 폴백을 표시한다', () => {
    renderWithProviders(
      <UserAvatar name={null} avatarUrl={null} showTooltip={false} />,
    )

    expect(screen.getByText('?')).toBeInTheDocument()
  })

  it('isOnline이 true일 때 온라인 뱃지를 표시한다', () => {
    const { container } = renderWithProviders(
      <UserAvatar name="John" avatarUrl={null} isOnline={true} showTooltip={false} />,
    )

    const badge = container.querySelector('[data-slot="avatar-badge"]')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-emerald-500')
  })

  it('isOnline이 false일 때 온라인 뱃지를 표시하지 않는다', () => {
    const { container } = renderWithProviders(
      <UserAvatar name="John" avatarUrl={null} isOnline={false} showTooltip={false} />,
    )

    const badge = container.querySelector('[data-slot="avatar-badge"]')
    expect(badge).not.toBeInTheDocument()
  })

  it('isOnline 기본값은 false이다', () => {
    const { container } = renderWithProviders(
      <UserAvatar name="John" avatarUrl={null} showTooltip={false} />,
    )

    const badge = container.querySelector('[data-slot="avatar-badge"]')
    expect(badge).not.toBeInTheDocument()
  })

  it('name이 null일 때 폴백에 ?를 표시하고 아바타가 렌더링된다', () => {
    const { container } = renderWithProviders(
      <UserAvatar name={null} avatarUrl="https://example.com/avatar.jpg" showTooltip={false} />,
    )

    // Even with avatarUrl, jsdom can't load images so fallback is shown.
    // The fallback should show "?" for null name.
    const avatar = container.querySelector('[data-slot="avatar"]')
    expect(avatar).toBeInTheDocument()
    expect(screen.getByText('?')).toBeInTheDocument()
  })

  it('sm 사이즈를 전달할 수 있다', () => {
    const { container } = renderWithProviders(
      <UserAvatar name="John" avatarUrl={null} size="sm" showTooltip={false} />,
    )

    const avatar = container.querySelector('[data-slot="avatar"]')
    expect(avatar).toHaveAttribute('data-size', 'sm')
  })

  it('lg 사이즈를 전달할 수 있다', () => {
    const { container } = renderWithProviders(
      <UserAvatar name="John" avatarUrl={null} size="lg" showTooltip={false} />,
    )

    const avatar = container.querySelector('[data-slot="avatar"]')
    expect(avatar).toHaveAttribute('data-size', 'lg')
  })
})
