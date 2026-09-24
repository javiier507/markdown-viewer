# Agent Guide

This guide directs agents to the project documentation, repository rules, and available skills.

## Project

Read [README.md](./README.md) for the project overview, setup, commands, and layout.

## Rules

- Interface and code must be in English.
- All dependencies in `package.json` must use exact versions (no `^`, `~`, or other range specifiers).

## Git

Never run git commands on your own — no `git add`, `git commit`, or `git push`. Run them only when the developer explicitly asks.
When asked to commit, apply the `conventional-commits` skill.

## Skills

- [Conventional Commits](./.claude/skills/conventional-commits/SKILL.md) — required when the developer explicitly asks to create a commit.
- [UI Guidelines](./.claude/skills/ui-guidelines/SKILL.md) — required before changing JSX or CSS for application chrome, controls, panels, dialogs, screens, themes, or interaction states.
- [Frontend Design](./.claude/skills/frontend-design/SKILL.md) — use together with UI Guidelines for new screens, substantial redesigns, or explicit visual exploration.
- [Markdown Viewer](./.claude/skills/markdown-viewer/SKILL.md) — use for Markdown rendering, prose and syntax styles, document links, anchors, code-copy behavior, Mermaid, or rendered-content robustness.
- [Web Design Guidelines](./.claude/skills/web-design-guidelines/SKILL.md) — use for requested UI, UX, or accessibility audits; it reviews but does not modify code unless fixes are also requested.
- [Tauri v2](./.claude/skills/tauri-v2/SKILL.md) — use for Tauri configuration, Rust commands, IPC, capabilities, builds, and deployment.

When scopes overlap, use every applicable skill. `frontend-design` owns an explicitly requested visual direction; `ui-guidelines` owns integration with the established application conventions. A redesign may change those conventions only when requested and must update UI Guidelines in the same change.
