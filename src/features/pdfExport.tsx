import { Document, Page, StyleSheet, Text, View, pdf } from '@react-pdf/renderer'
import { buildPreviewResume, type PreviewResume, type PreviewSection } from '../components/preview/previewData'
import type { Resume, ResumeStyle, TemplateId } from '../stores/types'

export async function exportResumePdf(resume: Resume) {
  const preview = buildPreviewResume(resume)
  const blob = await pdf(<ResumePdf preview={preview} />).toBlob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${fileName(preview.personal?.data.fullName || resume.name)}-Resume.pdf`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function ResumePdf({ preview }: { preview: PreviewResume }) {
  const theme = makePdfTheme(preview.style, preview.templateId)
  return (
    <Document title="Resume">
      <Page size={preview.style.pageSize === 'letter' ? 'LETTER' : 'A4'} style={theme.page}>
        {preview.personal ? (
          <View style={theme.header}>
            <Text style={theme.name}>{preview.personal.data.fullName || 'Your name'}</Text>
            {preview.personal.data.title && preview.templateId !== 'professional' ? (
              <Text style={theme.title}>{preview.personal.data.title}</Text>
            ) : null}
            <Text style={theme.contact}>
              {[preview.personal.data.email, preview.personal.data.phone, preview.personal.data.location].filter(Boolean).join('  ·  ')}
            </Text>
            {[preview.personal.data.website, ...preview.personal.data.links.map((link) => `${link.label}: ${link.url}`)].filter(Boolean).length ? (
              <Text style={theme.links}>
                {[preview.personal.data.website, ...preview.personal.data.links.map((link) => `${link.label}: ${link.url}`)]
                  .filter(Boolean)
                  .join('   ')}
              </Text>
            ) : null}
          </View>
        ) : null}
        <View style={theme.sections}>
          {preview.sections.map((section) => (
            <PdfSection key={section.id} section={section} theme={theme} />
          ))}
        </View>
      </Page>
    </Document>
  )
}

function PdfSection({ section, theme }: { section: PreviewSection; theme: PdfTheme }) {
  return (
    <View style={theme.section}>
      <SectionHeading title={section.title} theme={theme} />
      {section.kind === 'summary' ? <Text style={theme.copy}>{section.data.text}</Text> : null}
      {section.kind === 'skills'
        ? section.data.groups.map((group) => (
            <Text key={group.id} style={theme.copy}>
              <Text style={theme.bold}>{group.label}: </Text>
              {group.skills.join(' · ')}
            </Text>
          ))
        : null}
      {section.kind === 'experience'
        ? section.data.items.map((item) => (
            <View key={item.id} style={theme.item}>
              <View style={theme.row}>
                <View style={theme.rowMain}>
                  <Text style={theme.main}>
                    {item.role || 'Role'}
                    {item.company ? <Text style={theme.company}> · {item.company}</Text> : null}
                  </Text>
                  {item.location ? <Text style={theme.muted}>{item.location}</Text> : null}
                </View>
                <Text style={theme.date}>{item.start || '—'} → {item.current ? 'present' : item.end || '—'}</Text>
              </View>
              {item.bullets.length ? (
                <View style={theme.list}>
                  {item.bullets.map((bullet) => (
                    <Text key={bullet.id} style={theme.bullet}>
                      • {bullet.text}
                    </Text>
                  ))}
                </View>
              ) : null}
            </View>
          ))
        : null}
      {section.kind === 'education'
        ? section.data.items.map((item) => (
            <View key={item.id} style={theme.item}>
              <View style={theme.row}>
                <View style={theme.rowMain}>
                  <Text style={theme.main}>{item.school || 'School'}</Text>
                  <Text style={theme.copy}>
                    {[item.degree, item.field].filter(Boolean).join(' · ')}
                    {item.notes ? <Text style={theme.light}> — {item.notes}</Text> : null}
                  </Text>
                </View>
                <Text style={theme.date}>{item.start || '—'} → {item.end || '—'}</Text>
              </View>
            </View>
          ))
        : null}
      {section.kind === 'projects'
        ? section.data.items.map((item) => {
            const url = splitImportedUrl(item.url)
            const description = mergeProjectDescription(url.trailing, item.description)
            return (
              <View key={item.id} style={theme.item}>
                <Text style={theme.main}>{item.name || 'Project'}</Text>
                {url.href ? <Text style={theme.muted}>{url.href}</Text> : null}
                {description ? <Text style={theme.copy}>{description}</Text> : null}
                {item.bullets.length ? (
                  <View style={theme.list}>
                    {item.bullets.map((bullet) => (
                      <Text key={bullet.id} style={theme.bullet}>
                        • {bullet.text}
                      </Text>
                    ))}
                  </View>
                ) : null}
                {item.tech.length ? (
                  <Text style={theme.copy}>
                    <Text style={theme.bold}>Tech Stack: </Text>
                    {item.tech.join(', ')}
                  </Text>
                ) : null}
              </View>
            )
          })
        : null}
      {section.kind === 'custom'
        ? section.data.items.map((item) => (
            <View key={item.id} style={theme.item}>
              <View style={theme.row}>
                <Text style={theme.main}>{item.title}</Text>
                {item.subtitle ? <Text style={theme.date}>{item.subtitle}</Text> : null}
              </View>
              {item.body ? <Text style={theme.copy}>{item.body}</Text> : null}
            </View>
          ))
        : null}
    </View>
  )
}

function SectionHeading({ title, theme }: { title: string; theme: PdfTheme }) {
  if (theme.divider === 'none' || theme.professional) {
    return <Text style={theme.heading}>{title}</Text>
  }
  return (
    <View style={theme.headingRow}>
      <Text style={theme.heading}>{title}</Text>
      <View style={theme.headingLine} />
    </View>
  )
}

type PdfTheme = ReturnType<typeof makePdfTheme>

function makePdfTheme(style: ResumeStyle, templateId: TemplateId) {
  const professional = templateId === 'professional'
  const compact = templateId === 'compact'
  const modern = templateId === 'modern'
  const px = 0.75
  const fontFamily = pdfFont(style.font)
  const boldFont = pdfBoldFont(style.font)
  const ink = style.textColor || '#15151a'
  const accent = style.accentColor || '#0a84ff'
  const fontSize = professional ? style.fontSize * px : compact ? Math.min(style.fontSize * 0.88, 11.2) : style.fontSize * px
  const pagePadding = professional
    ? [52, 60, 44, 60].map((value) => value * style.marginScale * px)
    : templateId === 'compact' || style.spacing === 'compact'
      ? [36, 42, 36, 42].map((value) => value * style.marginScale * 0.75)
      : style.spacing === 'wide'
        ? [56, 56, 56, 56].map((value) => value * style.marginScale * 0.75)
        : [48, 48, 48, 48].map((value) => value * style.marginScale * 0.75)
  const sectionGap = professional
    ? 24 * style.sectionSpacing * px
    : (style.spacing === 'wide' ? 26 : style.spacing === 'normal' ? 21 : 13.5) * style.sectionSpacing
  const itemGap = professional
    ? 9 * style.sectionSpacing * px
    : (style.spacing === 'wide' ? 13.5 : style.spacing === 'normal' ? 10.5 : 6.75) * style.sectionSpacing
  const headingSize = professional ? 13 * px : modern ? 9.75 : compact ? 12 : 15
  const dateWidth = professional ? 150 * px : 118

  const sheet = StyleSheet.create({
    page: {
      paddingTop: pagePadding[0],
      paddingRight: pagePadding[1],
      paddingBottom: pagePadding[2],
      paddingLeft: pagePadding[3],
      fontFamily,
      color: ink,
      lineHeight: style.lineHeight,
    },
    header: {
      textAlign: professional ? 'center' : 'left',
      borderBottomWidth: professional ? 0 : 1,
      borderBottomColor: mix(ink, 0.15),
      paddingBottom: professional ? 0 : 15,
      marginBottom: professional ? 28 : 24,
      ...(modern ? { borderTopWidth: 3, borderTopColor: accent, paddingTop: 13.5 } : {}),
    },
    name: {
      color: accent,
      fontFamily: boldFont,
      fontSize: professional ? 28 * px : compact ? 25.5 : 33,
      lineHeight: professional ? 1.1 : 0.96,
    },
    title: {
      color: mix(ink, 0.64),
      fontSize: 11.25,
      marginTop: 3,
    },
    contact: {
      color: mix(ink, professional ? 0.78 : 0.62),
      fontSize: professional ? 12.5 * px : 8.6,
      marginTop: professional ? 6 : 9,
      lineHeight: professional ? 1.25 : 1.2,
    },
    links: {
      color: mix(ink, professional ? 0.78 : 0.62),
      fontSize: professional ? 12.5 * px : 8.6,
      marginTop: professional ? 0 : 4.5,
      lineHeight: professional ? 1.25 : 1.2,
    },
    sections: {
      gap: sectionGap,
    },
    section: {
      gap: professional ? 8 : 6,
    },
    headingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
      marginBottom: 0,
    },
    heading: {
      color: accent,
      fontFamily: professional ? fontFamily : boldFont,
      fontSize: headingSize,
      lineHeight: 1,
      textTransform: 'uppercase',
    },
    headingLine: {
      flexGrow: 1,
      height: style.divider === 'accent' ? 1.5 : 0.75,
      backgroundColor: style.divider === 'accent' ? accent : mix(ink, 0.15),
    },
    item: {
      gap: professional ? 3 : 2.5,
      marginBottom: itemGap,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 12,
    },
    rowMain: {
      flexGrow: 1,
      flexShrink: 1,
      paddingRight: 6,
    },
    main: {
      color: ink,
      fontFamily: boldFont,
      fontSize: professional ? 15 * px : compact ? 9.4 : 10.1,
      lineHeight: professional ? 1.15 : 1.15,
    },
    company: {
      fontFamily,
      color: mix(ink, 0.7),
    },
    date: {
      width: dateWidth,
      color: professional ? ink : mix(ink, 0.62),
      fontFamily: professional ? boldFont : pdfMonoFont(),
      fontSize: professional ? 13 * px : 8.6,
      lineHeight: 1.25,
      textAlign: 'right',
      textTransform: professional ? 'none' : 'uppercase',
    },
    copy: {
      color: mix(ink, 0.8),
      fontSize,
      lineHeight: style.lineHeight,
    },
    muted: {
      color: professional ? ink : mix(ink, 0.55),
      fontFamily: professional ? boldFont : fontFamily,
      fontSize: professional ? 13.5 * px : 9,
      lineHeight: 1.25,
    },
    light: {
      color: mix(ink, 0.45),
    },
    list: {
      marginTop: 3,
      marginLeft: 12 * style.indent,
      gap: 1.5,
    },
    bullet: {
      color: mix(ink, 0.8),
      fontSize,
      lineHeight: style.lineHeight,
    },
    bold: {
      fontFamily: boldFont,
      color: ink,
    },
  })
  return {
    ...sheet,
    professional,
    divider: style.divider,
  }
}

function splitImportedUrl(value: string) {
  const [href = '', ...rest] = value.split('•')
  return {
    href: href.trim(),
    trailing: rest.join(' ').trim(),
  }
}

function mergeProjectDescription(fromUrl: string, description: string) {
  const parts = [fromUrl, description]
    .map((part) => part.trim())
    .filter(Boolean)
  return Array.from(new Set(parts)).join(' ')
}

function pdfFont(font: ResumeStyle['font']) {
  if (font === 'serif' || font === 'merriweather' || font === 'times') return 'Times-Roman'
  if (font === 'mono' || font === 'roboto-mono') return 'Courier'
  return 'Helvetica'
}

function pdfBoldFont(font: ResumeStyle['font']) {
  if (font === 'serif' || font === 'merriweather' || font === 'times') return 'Times-Bold'
  if (font === 'mono' || font === 'roboto-mono') return 'Courier-Bold'
  return 'Helvetica-Bold'
}

function pdfMonoFont() {
  return 'Courier'
}

function mix(hex: string, alpha: number) {
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return hex
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  const blend = (channel: number) => Math.round(255 + (channel - 255) * alpha)
  return `rgb(${blend(r)}, ${blend(g)}, ${blend(b)})`
}

function fileName(value: string) {
  return value.trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'Resume'
}
