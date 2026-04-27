import { Document, Page, StyleSheet, Text, View, pdf } from '@react-pdf/renderer'
import { buildPreviewResume, type PreviewResume, type PreviewSection } from '../components/preview/previewData'
import type { Resume } from '../stores/types'

export async function exportResumePdf(resume: Resume) {
  const preview = buildPreviewResume(resume)
  const blob = await pdf(<ResumePdf preview={preview} />).toBlob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${fileName(preview.personal?.data.fullName || resume.name)}-Resume.pdf`
  link.click()
  URL.revokeObjectURL(url)
}

function ResumePdf({ preview }: { preview: PreviewResume }) {
  const pageSize = preview.style.pageSize === 'letter' ? 'LETTER' : 'A4'
  const accent = preview.style.accentColor || '#0a84ff'
  const fontSize = preview.style.spacing === 'wide' ? 10.5 : preview.style.spacing === 'normal' ? 10 : 9.4
  const gap = preview.style.spacing === 'wide' ? 9 : preview.style.spacing === 'normal' ? 7 : 5
  return (
    <Document title="Resume">
      <Page size={pageSize} style={[styles.page, { fontSize }]}>
        {preview.personal ? (
          <View style={styles.header}>
            <Text style={styles.name}>{preview.personal.data.fullName}</Text>
            {preview.personal.data.title ? <Text style={styles.title}>{preview.personal.data.title}</Text> : null}
            <Text style={styles.contact}>
              {[preview.personal.data.email, preview.personal.data.phone, preview.personal.data.location, preview.personal.data.website]
                .filter(Boolean)
                .join(' | ')}
            </Text>
            {preview.personal.data.links.length ? (
              <Text style={styles.contact}>
                {preview.personal.data.links.map((link) => `${link.label}: ${link.url}`).join(' | ')}
              </Text>
            ) : null}
          </View>
        ) : null}
        <View style={{ gap }}>
          {preview.sections.map((section) => (
            <PdfSection key={section.id} section={section} accent={accent} />
          ))}
        </View>
      </Page>
    </Document>
  )
}

function PdfSection({ section, accent }: { section: PreviewSection; accent: string }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.heading, { color: accent, borderBottomColor: accent }]}>{section.title}</Text>
      {section.kind === 'summary' ? <Text>{section.data.text}</Text> : null}
      {section.kind === 'skills'
        ? section.data.groups.map((group) => (
            <Text key={group.id}>
              <Text style={styles.bold}>{group.label}: </Text>
              {group.skills.join(', ')}
            </Text>
          ))
        : null}
      {section.kind === 'experience'
        ? section.data.items.map((item) => (
            <View key={item.id} style={styles.item}>
              <Text style={styles.bold}>
                {item.role} {item.company ? `| ${item.company}` : ''}
              </Text>
              <Text style={styles.muted}>
                {[item.location, `${item.start} - ${item.current ? 'present' : item.end}`].filter(Boolean).join(' | ')}
              </Text>
              {item.bullets.map((bullet) => (
                <Text key={bullet.id}>• {bullet.text}</Text>
              ))}
            </View>
          ))
        : null}
      {section.kind === 'education'
        ? section.data.items.map((item) => (
            <View key={item.id} style={styles.item}>
              <Text style={styles.bold}>{item.school}</Text>
              <Text>{[item.degree, item.field, item.notes].filter(Boolean).join(' | ')}</Text>
              <Text style={styles.muted}>{[item.start, item.end].filter(Boolean).join(' - ')}</Text>
            </View>
          ))
        : null}
      {section.kind === 'projects'
        ? section.data.items.map((item) => (
            <View key={item.id} style={styles.item}>
              <Text style={styles.bold}>{[item.name, item.url].filter(Boolean).join(' | ')}</Text>
              {item.description ? <Text>{item.description}</Text> : null}
              {item.bullets.map((bullet) => (
                <Text key={bullet.id}>• {bullet.text}</Text>
              ))}
              {item.tech.length ? <Text style={styles.muted}>Tech: {item.tech.join(', ')}</Text> : null}
            </View>
          ))
        : null}
      {section.kind === 'custom'
        ? section.data.items.map((item) => (
            <View key={item.id} style={styles.item}>
              <Text style={styles.bold}>{item.title}</Text>
              {item.subtitle ? <Text style={styles.muted}>{item.subtitle}</Text> : null}
              <Text>{item.body}</Text>
            </View>
          ))
        : null}
    </View>
  )
}

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: 'Helvetica',
    color: '#111827',
    lineHeight: 1.35,
  },
  header: {
    textAlign: 'center',
    marginBottom: 14,
  },
  name: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
  },
  title: {
    fontSize: 11,
    marginTop: 2,
  },
  contact: {
    fontSize: 8.5,
    marginTop: 3,
  },
  section: {
    gap: 3,
  },
  heading: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    textTransform: 'uppercase',
    borderBottomWidth: 1,
    paddingBottom: 2,
    marginBottom: 2,
  },
  item: {
    gap: 2,
    marginBottom: 3,
  },
  bold: {
    fontFamily: 'Helvetica-Bold',
  },
  muted: {
    color: '#4b5563',
    fontSize: 8.5,
  },
})

function fileName(value: string) {
  return value.trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'Resume'
}
