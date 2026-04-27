import { useResumeStore } from '../../../stores/resumeStore'
import { FieldLabel, TextArea } from '../../ui/Input'
import type { ResumeSection } from '../../../stores/types'

export function SummaryForm({
  resumeId,
  section,
}: {
  resumeId: string
  section: ResumeSection<'summary'>
}) {
  const update = useResumeStore((s) => s.updateSectionData)
  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel hint={`${section.data.text.length} chars`}>Summary</FieldLabel>
      <TextArea
        rows={8}
        value={section.data.text}
        onChange={(e) => update<'summary'>(resumeId, section.id, { text: e.target.value })}
        placeholder="One short paragraph that frames who you are."
      />
      <p className="text-[11px] text-[var(--text-faint)] mt-1">
        Aim for 2–3 sentences. Lead with role, anchor with what you build, end with what you care about.
      </p>
    </div>
  )
}
