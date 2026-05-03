# Competitor Analysis: Rezi Resume Builder

Observed in Brave on 2026-05-02 at `app.rezi.ai`. This note focuses on product patterns and excludes personal resume data shown in the account.

## High-Level Takeaway

Rezi feels stronger because it treats resume building as a guided optimization workflow, not just a form plus preview. The user can edit sections, see the resume, adjust formatting, check score, target job keywords, change templates, and export from one continuous workspace.

## Second UX Pass: Polish Notes

Rezi feels calmer than its feature count suggests because it does not show every control at once. The core journey is split into clear modes: focused section writing, finish-up preview, and formatting/export. In the finish-up view, the first visible actions are only Auto-adjust, Adjustments, Template, Share, and Download PDF; the dense font, spacing, divider, color, paper, and zoom controls appear as an adjustment layer.

Applied direction for Resumify:

- Default new resumes to a write-first editor instead of a split editor.
- Collapse the global sidebar by default so the resume task owns the screen.
- Rename mode controls to Write, Split, and Preview for clearer intent.
- Keep preview customization behind an Adjustments toggle, with Auto-adjust and Template as the primary visible actions.
- Show job keyword targeting only in full preview mode, not while the user is trying to write.
- Keep section health visible only when the selected section actually has issues.

## Observed Navigation Model

- Left vertical app rail with product areas: resumes, AI/assistant, documents, review/job-related areas, and Rezi MCP.
- Horizontal resume workflow tabs: resume name, Contact, Experience, Project, Education, Certifications, Skills, Summary, Finish Up & Preview, AI Cover Letter.
- Each tab maps to a focused editing mode while preserving resume context.
- Finish Up & Preview becomes a formatting/export workspace rather than only a read-only preview.

## Builder Layout Patterns

- Section editing mode uses a two-pane feel:
  - Left column shows resume score, section list, draggable entries, and section-specific issues.
  - Main panel shows the selected entry form.
- Preview mode uses a center paper canvas with a persistent right rail for scoring and keyword guidance.
- The preview itself appears directly editable in places, which makes the document feel tangible.
- Save state is visible through "Last Saved" text, reducing anxiety around edits.
- Version history appears alongside editing flows, suggesting recoverability.

## Customization Controls

Rezi exposes customization as direct toolbar controls instead of burying it in settings.

- Template modal:
  - Categories: All templates, Saved, Recent, Recommended.
  - Format filters: Simple, Modern, Creative, Compact.
  - Template cards include preview thumbnails, current state, and Pro labels.
  - Observed templates include Rezi Standard Format, Rezi Compact Format, Rezi Modern Template, Harvard Format, Jake's Resume, Rezi Bold Format, Rezi Alternative Format, Highlight Format, Highlight Compact Format, Rezi Dev Compact, and Rezi Dev.
- Finish-up toolbar:
  - Auto-adjust action.
  - Adjustments toggle.
  - Template modal.
  - Share action.
  - Download PDF split button.
  - Icons toggle.
  - Profile picture toggle.
  - Font family dropdown with options such as Merriweather, Source Sans Pro, Calibri, Times New Roman, Comic Sans, Courier New, and Roboto Mono.
  - Font size decrement/increment.
  - Line height control.
  - Section spacing control.
  - Indent control.
  - Section divider toggle.
  - Paper size control.
  - Zoom control.
  - Text color and accent color controls.
  - View as pages toggle.

## Resume Quality Guidance

- Score is always visible and framed as a health signal.
- Score panel shows a number, label, and progress/gauge visualization.
- Section editor surfaces specific checks beside the relevant section.
- Observed checks include:
  - Punctuated bullet points.
  - Personal pronouns.
  - Buzzwords.
  - Passive voice.
  - Filler words.
  - Wordy content.
  - Quantified bullet points.
- Some guidance is free and some is Pro-gated, but even the gated items communicate what quality means.
- The feedback is tied to concrete bullet numbers where possible.

## AI And Job Targeting

- AI Keyword Targeting is visible in preview.
- Matched keywords from a job description are shown as successes.
- Missing keyword suggestions are shown in the same rail, with Pro gating where applicable.
- There is an explicit Update Job Description action.
- Experience bullet editor includes AI generation:
  - Generate/complete bullet action.
  - Additional generation options.
  - Helper copy nudging for a balanced mix of descriptive and metric-based bullets.

## Editing Details Worth Borrowing

- Draggable entries within sections are obvious and local to the section.
- "Sort by date" exists for experience entries.
- Contact fields include "Show on resume" toggles for optional location details.
- Link fields normalize/display common prefixes, for example LinkedIn URL handling.
- Company context can be captured but optionally hidden from the resume, improving AI suggestions without cluttering the document.
- Save buttons are action-specific, for example "Save Basic Info" and "Save to Experience List."

## Current Resumify Comparison

From the current codebase:

- Resumify already has builder, preview, and combined views.
- Resumify has templates: Professional, Classic, Modern, Compact.
- Style controls currently include page size, broad font category, broad spacing, and accent color.
- The Assist panel already includes score, import, job match, profiles, history, bullet suggestions, AI settings, and backup.
- Section drag/reorder exists, but quality guidance is mostly separate from the section being edited.
- Preview is one static surface with limited page/layout controls.
- Template selection is a compact dropdown, not a visual gallery.
- Customization granularity is much lower than Rezi: no font size, line height, section spacing numeric control, indent, section divider, zoom, text color, icon/profile image toggles, or page view toggle.

## Product Gaps To Close

- Make customization feel immediate and visual.
- Move the most-used formatting controls beside preview instead of hiding them in the top bar.
- Add a visual template gallery with categories and thumbnails.
- Bring score issues into the section editor, next to the exact section/item that needs fixing.
- Add bullet-level feedback for punctuation, metrics, passive voice, filler words, weak verbs, and pronouns.
- Add direct AI actions at the field level, especially for bullets and summaries.
- Improve job targeting by keeping matched and missing keywords visible beside preview.
- Add version/recovery affordances where edits happen.
- Add more precise style controls: font size, line height, section spacing, margins/indent, divider style, text color, accent color, and zoom.

## Suggested Enhancement Order

1. Preview customization toolbar: font size, line height, section spacing, page size, template, accent color, text color, zoom.
2. Visual template gallery with thumbnails and filters.
3. Section-local quality panel that maps resume score issues to the selected section/item.
4. Bullet editor upgrades: per-bullet checks, AI rewrite/generate, metric prompts, and stronger empty states.
5. Job keyword side rail in preview mode.
6. Version history and autosave status in the main builder surface.

## Design Direction For Resumify

Keep Resumify quieter and less crowded than Rezi, but borrow the workflow density. The ideal direction is a professional three-zone editor:

- Left: sections, reorder, section health.
- Center: focused form or direct document preview.
- Right: preview tools, score, job targeting, and AI suggestions.

The win is not to copy Rezi's exact dark UI. The win is to make users feel they can shape a strong resume without hunting through the app.
