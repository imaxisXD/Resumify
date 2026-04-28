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
  const isProfessional = preview.templateId === 'professional'
  const fontSize = isProfessional
    ? 13
    : preview.style.spacing === 'wide'
      ? 10.5
      : preview.style.spacing === 'normal'
        ? 10
        : 9.4
  const sectionGap = isProfessional
    ? 24
    : preview.style.spacing === 'wide'
      ? 9
      : preview.style.spacing === 'normal'
        ? 7
        : 5
  return (
    <Document title="Resume">
      <Page size={pageSize} style={[isProfessional ? styles.professionalPage : styles.page, { fontSize }]}>
        {preview.personal ? (
          <View style={isProfessional ? styles.professionalHeader : styles.header}>
            <Text style={[isProfessional ? styles.professionalName : styles.name, { color: accent }]}>
              {preview.personal.data.fullName}
            </Text>
            {!isProfessional && preview.personal.data.title ? <Text style={styles.title}>{preview.personal.data.title}</Text> : null}
            <Text style={isProfessional ? styles.professionalContact : styles.contact}>
              {[preview.personal.data.email, preview.personal.data.phone, preview.personal.data.location, preview.personal.data.website]
                .filter(Boolean)
                .join(isProfessional ? '  ·  ' : ' | ')}
            </Text>
            {preview.personal.data.links.length ? (
              <Text style={isProfessional ? styles.professionalContact : styles.contact}>
                {preview.personal.data.links.map((link) => `${link.label}: ${link.url}`).join(isProfessional ? '  ' : ' | ')}
              </Text>
            ) : null}
          </View>
        ) : null}
        <View style={{ gap: sectionGap }}>
          {preview.sections.map((section) => (
            <PdfSection key={section.id} section={section} accent={accent} professional={isProfessional} />
          ))}
        </View>
      </Page>
    </Document>
  )
}

function PdfSection({ section, accent, professional }: { section: PreviewSection; accent: string; professional: boolean }) {
  return (
    <View style={professional ? styles.professionalSection : styles.section}>
      <Text style={[professional ? styles.professionalHeading : styles.heading, { color: accent, borderBottomColor: accent }]}>
        {section.title}
      </Text>
      {section.kind === 'summary' ? <Text>{section.data.text}</Text> : null}
      {section.kind === 'skills'
        ? section.data.groups.map((group) => (
            <Text key={group.id} style={professional ? styles.professionalCopy : undefined}>
              <Text style={styles.bold}>{group.label}: </Text>
              {group.skills.join(professional ? ' · ' : ', ')}
            </Text>
          ))
        : null}
      {section.kind === 'experience'
        ? section.data.items.map((item) => (
            <View key={item.id} style={professional ? styles.professionalItem : styles.item}>
              <View style={styles.row}>
                <Text style={professional ? styles.professionalMain : styles.bold}>
                  {item.role}
                  {item.company ? <Text style={professional ? styles.professionalCompany : undefined}> · {item.company}</Text> : null}
                </Text>
                <Text style={professional ? styles.professionalDate : styles.muted}>
                  {item.start || '—'} → {item.current ? 'present' : item.end || '—'}
                </Text>
              </View>
              {item.location ? <Text style={professional ? styles.professionalMuted : styles.muted}>{item.location}</Text> : null}
              {item.bullets.map((bullet) => (
                <Text key={bullet.id} style={professional ? styles.professionalBullet : undefined}>
                  •  {bullet.text}
                </Text>
              ))}
            </View>
          ))
        : null}
      {section.kind === 'education'
        ? section.data.items.map((item) => (
            <View key={item.id} style={professional ? styles.professionalItem : styles.item}>
              <View style={styles.row}>
                <Text style={professional ? styles.professionalMain : styles.bold}>{item.school}</Text>
                <Text style={professional ? styles.professionalDate : styles.muted}>
                  {item.start || '—'} → {item.end || '—'}
                </Text>
              </View>
              <Text style={professional ? styles.professionalCopy : undefined}>
                {[item.degree, item.field].filter(Boolean).join(' · ')}
                {item.notes ? <Text style={styles.light}> — {item.notes}</Text> : null}
              </Text>
            </View>
          ))
        : null}
      {section.kind === 'projects'
        ? section.data.items.map((item) => (
            <View key={item.id} style={professional ? styles.professionalItem : styles.item}>
              <View style={styles.row}>
                <Text style={professional ? styles.professionalMain : styles.bold}>{item.name}</Text>
                {item.url ? <Text style={professional ? styles.professionalDate : styles.muted}>{item.url}</Text> : null}
              </View>
              {item.description ? <Text style={professional ? styles.professionalCopy : undefined}>{item.description}</Text> : null}
              {item.bullets.map((bullet) => (
                <Text key={bullet.id} style={professional ? styles.professionalBullet : undefined}>
                  •  {bullet.text}
                </Text>
              ))}
              {item.tech.length ? (
                <Text style={professional ? styles.professionalTech : styles.muted}>
                  <Text style={styles.bold}>Tech Stack: </Text>
                  {item.tech.join(', ')}
                </Text>
              ) : null}
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  light: {
    color: '#999999',
  },
  professionalPage: {
    paddingTop: 52,
    paddingRight: 60,
    paddingBottom: 44,
    paddingLeft: 60,
    fontFamily: 'Helvetica',
    color: '#15151a',
    lineHeight: 1.32,
  },
  professionalHeader: {
    textAlign: 'center',
    marginBottom: 28,
  },
  professionalName: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    lineHeight: 1.1,
  },
  professionalContact: {
    fontSize: 12.5,
    color: '#505057',
    marginTop: 4,
    lineHeight: 1.25,
  },
  professionalSection: {
    gap: 8,
  },
  professionalHeading: {
    fontFamily: 'Helvetica',
    fontSize: 13,
    lineHeight: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  professionalItem: {
    gap: 3,
    marginBottom: 4,
  },
  professionalMain: {
    flex: 1,
    fontFamily: 'Helvetica-Bold',
    fontSize: 15,
    lineHeight: 1.15,
    color: '#15151a',
  },
  professionalCompany: {
    fontFamily: 'Helvetica',
    fontWeight: 400,
    color: '#55555b',
  },
  professionalDate: {
    minWidth: 150,
    fontFamily: 'Helvetica-Bold',
    fontSize: 13,
    lineHeight: 1.35,
    textAlign: 'right',
    color: '#15151a',
  },
  professionalMuted: {
    fontFamily: 'Helvetica-Bold',
    color: '#15151a',
    fontSize: 13.5,
    marginTop: 1,
  },
  professionalCopy: {
    color: '#4c4c52',
    fontSize: 13,
    lineHeight: 1.32,
  },
  professionalBullet: {
    color: '#4c4c52',
    fontSize: 13,
    lineHeight: 1.32,
    marginLeft: 18,
  },
  professionalTech: {
    color: '#15151a',
    fontSize: 13,
    lineHeight: 1.32,
    textAlign: 'center',
    marginTop: 4,
  },
})

function fileName(value: string) {
  return value.trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'Resume'
}
