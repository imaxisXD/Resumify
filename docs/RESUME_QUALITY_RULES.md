# Resume Quality Rules

These rules define the checks Resumify uses for scoring, section health, and AI review prompts. They should stay small, concrete, and testable.

## Bullet Rules

A strong bullet usually has:

- an action verb
- the thing shipped or improved
- a concrete outcome
- a metric, scale, audience, or technical specificity when available
- one sentence or one tight clause chain
- no first-person pronouns
- clean punctuation

Weak patterns:

- "responsible for"
- "worked on"
- "helped with"
- "various tasks"
- vague impact such as "improved user experience" without evidence
- passive wording
- multiple unrelated achievements packed into one bullet

## Metrics

Good metrics include:

- percentage changes
- time saved
- latency or performance changes
- revenue, conversion, retention, reliability, or quality impact
- number of users, teammates, services, pages, campaigns, or customers affected

If no metric is known, AI should ask a question. It must not invent one.

## Job Matching

Job keyword suggestions should:

- prefer meaningful skills, tools, frameworks, domains, and responsibilities
- distinguish matched keywords from missing keywords
- avoid stuffing repeated terms into unrelated sections
- suggest natural insertions into bullets, skills, summary, or projects

## Import Quality

Imported resumes should preserve:

- personal contact details
- section order
- roles, companies, dates, and bullets
- skills as grouped tags when possible
- project URLs and project bullets

Importers may be imperfect, but they should avoid dropping obvious sections or merging multiple companies into one role.
