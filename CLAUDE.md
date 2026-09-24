# Agent Guide

This guide directs agents to the project documentation, repository rules, and available skills.

## Project

Read [README.md](./README.md) for the project overview, setup, commands, and layout.

## Rules

- Interface and code must be in English.
- All dependencies in `package.json` must use exact versions (no `^`, `~`, or other range specifiers).

## Skills

- [Design System](./.claude/skills/design-system/SKILL.md) — required before changing JSX or CSS that affects the UI.
- [Tauri v2](./.claude/skills/tauri-v2/SKILL.md) — use for Tauri configuration, Rust commands, IPC, capabilities, builds, and deployment.
