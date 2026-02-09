'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useShortcutHelpStore } from '@/stores/shortcut-help-store'
import { SHORTCUT_DISPLAY } from '@/lib/keyboard-shortcuts'

export function ShortcutHelpDialog() {
  const { isOpen, setOpen } = useShortcutHelpStore()

  const globalShortcuts = SHORTCUT_DISPLAY.filter((s) => s.scope === 'global')
  const projectShortcuts = SHORTCUT_DISPLAY.filter((s) => s.scope === 'project')

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>키보드 단축키</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h3 className="text-muted-foreground mb-2 text-xs font-semibold uppercase">전역</h3>
            <ul className="space-y-1">
              {globalShortcuts.map((s) => (
                <ShortcutRow key={s.key} shortcutKey={s.key} modifier={s.modifier} label={s.label} />
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-muted-foreground mb-2 text-xs font-semibold uppercase">프로젝트 내</h3>
            <ul className="space-y-1">
              {projectShortcuts.map((s) => (
                <ShortcutRow key={s.key} shortcutKey={s.key} modifier={s.modifier} label={s.label} />
              ))}
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ShortcutRow({ shortcutKey, modifier, label }: {
  shortcutKey: string
  modifier?: string
  label: string
}) {
  return (
    <li className="flex items-center justify-between py-1">
      <span className="text-sm">{label}</span>
      <kbd className="bg-muted text-muted-foreground inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-xs font-mono">
        {modifier && <span>{modifier}+</span>}
        <span>{shortcutKey}</span>
      </kbd>
    </li>
  )
}
