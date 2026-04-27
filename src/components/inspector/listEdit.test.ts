import { describe, expect, it } from 'vitest'
import { commitTagValue } from './TagsInput'
import { updateList } from './useSectionListField'

describe('list edits', () => {
  it('updates one item', () => {
    const next = updateList(
      [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' },
      ],
      { type: 'update', id: 'b', patch: { label: 'New' } },
    )

    expect(next).toEqual([
      { id: 'a', label: 'A' },
      { id: 'b', label: 'New' },
    ])
  })

  it('removes one item', () => {
    const next = updateList(
      [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' },
      ],
      { type: 'remove', id: 'a' },
    )

    expect(next).toEqual([{ id: 'b', label: 'B' }])
  })

  it('replaces the whole list', () => {
    const next = updateList([{ id: 'a' }], { type: 'replace', items: [{ id: 'b' }] })
    expect(next).toEqual([{ id: 'b' }])
  })

  it('trims tags and ignores empty drafts', () => {
    expect(commitTagValue(['React'], ' TypeScript ')).toEqual(['React', 'TypeScript'])
    expect(commitTagValue(['React'], '   ')).toEqual(['React'])
  })
})

