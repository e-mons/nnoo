---
name: create-project-skill
description: Creates or updates a focused Antigravity workspace skill for a repeatable NNOO engineering workflow and records it in the skills registry.
---

# Create a Project Skill

Create a new skill only when the task repeats, requires specialist steps, is too detailed for an always-on rule, and benefits from on-demand loading.

Required path:

```text
.agents/skills/<lowercase-hyphen-name>/SKILL.md
```

Required frontmatter:

```yaml
---
name: lowercase-hyphen-name
description: Clear third-person description explaining what it does and when to use it.
---
```

One skill must do one job. Include use conditions, steps, stop conditions, and completion evidence. Update `SKILLS_REGISTRY.md`.
