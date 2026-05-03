import { Link, useLocation, useRouter } from '@tanstack/react-router'
import { Files, PanelLeft, Sparkles, FolderClosed, ShieldCheck } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { Brand } from './Brand'
import { IconButton } from '../ui/IconButton'
import { useResumeStore } from '../../stores/resumeStore'

type Item = {
  to: string
  label: string
  icon: ReactNode
  match?: (path: string) => boolean
}

const navigation: Array<Item> = [
  { to: '/', label: 'Resumes', icon: <Files size={16} />, match: (p) => p === '/' },
  { to: '/templates', label: 'Templates', icon: <FolderClosed size={16} />, match: (p) => p.startsWith('/templates') },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(true)
  const { pathname } = useLocation()
  const router = useRouter()
  const createResume = useResumeStore((s) => s.createResume)

  const onCreate = () => {
    const id = createResume()
    router.navigate({ to: '/builder/$resumeId', params: { resumeId: id } })
  }

  return (
    <aside
      className={cn(
        'shrink-0 flex flex-col border-r border-[var(--border)] bg-[var(--bg-elevated)] animate-fade-in',
        collapsed ? 'w-[68px]' : 'w-[244px]',
      )}
    >
      <div
        className={cn(
          'h-[60px] flex items-center border-b border-[var(--border)]',
          collapsed ? 'justify-center px-0' : 'px-4',
        )}
      >
        <Brand collapsed={collapsed} />
      </div>

      <nav className={cn('flex-1 flex flex-col gap-6 py-5', collapsed ? 'px-2.5' : 'px-3')}>
        <SidebarGroup label="Navigation" collapsed={collapsed}>
          {navigation.map((item) => (
            <SidebarLink key={item.to} item={item} collapsed={collapsed} pathname={pathname} />
          ))}
        </SidebarGroup>
        <SidebarGroup label="New" collapsed={collapsed}>
          <button
            type="button"
            onClick={onCreate}
            className={cn(
              'group relative flex items-center gap-2.5 rounded-lg transition-[background,color,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] text-[13px] font-medium text-[var(--accent-hi)] active:scale-[0.97] active:duration-100',
              collapsed ? 'h-10 w-10 mx-auto justify-center' : 'h-9 px-2.5',
              'bg-gradient-to-r from-[var(--accent-soft)] to-transparent hover:from-[var(--accent-soft)] hover:to-[var(--accent-soft)]/40',
            )}
          >
            <Sparkles size={16} className="shrink-0" />
            {collapsed ? null : <span className="truncate">Create Resume</span>}
            {!collapsed ? (
              <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-faint)]">
                ⌘N
              </span>
            ) : null}
          </button>
        </SidebarGroup>
      </nav>

      <div className={cn('p-3 flex flex-col gap-3', collapsed && 'items-center')}>
        <div
          className={cn(
            'inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[12px] text-[var(--text-muted)]',
            collapsed ? 'size-10 justify-center' : 'h-9 px-3',
          )}
        >
          <ShieldCheck size={14} />
          {collapsed ? null : 'ATS-safe export'}
        </div>

        {collapsed ? null : (
          <div className="rounded-xl border border-dashed border-[var(--border-strong)] p-3 text-[12px]">
            <div className="font-display text-[18px] leading-none text-[var(--text)]">Local drafts</div>
            <p className="mt-1.5 text-[var(--text-faint)] leading-snug">
              Your resumes stay in this browser. Export when the layout is ready.
            </p>
          </div>
        )}

        <div
          className={cn(
            'flex items-center mt-1',
            collapsed ? 'justify-center' : 'justify-between',
          )}
        >
          <IconButton
            icon={<PanelLeft size={14} />}
            label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={() => setCollapsed((c) => !c)}
            size="sm"
          />
          {collapsed ? null : (
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-faint)]">
              v0.1
            </span>
          )}
        </div>
      </div>
    </aside>
  )
}

function SidebarGroup({
  label,
  collapsed,
  children,
}: {
  label: string
  collapsed?: boolean
  children: ReactNode
}) {
  return (
    <div className="flex flex-col">
      {!collapsed ? (
        <div className="px-2 pb-1.5 text-[10.5px] font-medium uppercase tracking-[0.16em] text-[var(--text-faint)]">
          {label}
        </div>
      ) : (
        <div className="mx-auto mb-1.5 h-px w-6 bg-[var(--border)]" />
      )}
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  )
}

function SidebarLink({
  item,
  collapsed,
  pathname,
}: {
  item: Item
  collapsed: boolean
  pathname: string
}) {
  const active = item.match
    ? item.match(pathname)
    : pathname.startsWith(item.to) && item.to !== '/'

  return (
    <Link
      to={item.to}
      className={cn(
        'group relative flex items-center gap-2.5 rounded-lg transition-[background,color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] text-[13px] font-medium',
        collapsed ? 'h-10 w-10 mx-auto justify-center' : 'h-9 px-2.5',
        active
          ? 'bg-[var(--surface)] text-[var(--text)]'
          : 'text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]',
      )}
    >
      <span className="inline-flex shrink-0">{item.icon}</span>
      {collapsed ? null : <span className="truncate">{item.label}</span>}
      {active && !collapsed ? (
        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--accent)] animate-pop-in" />
      ) : null}
    </Link>
  )
}
