---
name: conventional-commits
description: Write commit messages that comply with Conventional Commits and the project's Commitlint and Commitizen configuration. Use only when explicitly asked to create a commit.
---

# Conventional Commits

## When to use this skill

Use this skill **only when the developer explicitly asks you to create a commit**. Do not run Git commands (`git add`, `git commit`, or `git push`) without prior authorization.

When asked to commit, the message must follow [Conventional Commits v1.0.0](https://www.conventionalcommits.org/en/v1.0.0/) and the project's `@commitlint/config-conventional` configuration.

## Message format

```text
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

## Allowed commit types

The project uses `@commitlint/config-conventional` v20.5.0. Valid types are:

| Type | Use |
| --- | --- |
| `feat` | Adds a new feature. |
| `fix` | Fixes a bug. |
| `docs` | Documentation-only changes. |
| `style` | Changes that do not affect logic, such as whitespace, formatting, or semicolons. |
| `refactor` | Code restructuring that neither fixes a bug nor adds a feature. |
| `perf` | Improves performance. |
| `test` | Adds or fixes tests. |
| `build` | Changes to the build system or external dependencies. |
| `ci` | Changes to CI configuration or scripts. |
| `chore` | Other changes outside `src` and `test` files. |
| `revert` | Reverts an earlier commit. |

## Project rules

- Write descriptions in English.
- Write the `type` in lowercase.
- Write the subject (short description) in lowercase, without a trailing period.
- Keep every header, body, and footer line to a maximum of 100 characters.
- Leave a blank line between the description and the body, and between the body and footers.
- Commitlint rejects malformed commit messages.

## Scope

The scope is optional. It must be a noun describing an area of the codebase, enclosed in parentheses:

```text
feat(auth): add OAuth login
fix(api): correct user pagination
docs(readme): update installation instructions
```

## Breaking changes

Mark a breaking API change with `!` after the type or scope, a `BREAKING CHANGE:` footer in uppercase, or both:

```text
feat!: change the hasPermission signature
feat(api)!: remove the legacyId field from the response
```

With a footer:

```text
feat: change the hasPermission signature

BREAKING CHANGE: the authUser parameter is now required
```

When using `!`, the `BREAKING CHANGE:` footer is optional; explain the change in the body instead.

## Body and footers

- The body is free-form and may contain multiple paragraphs separated by blank lines.
- Footers use the Git trailer format:

```text
Reviewed-by: Jane Doe
Refs: #123
```

- `BREAKING CHANGE` and `BREAKING-CHANGE` are equivalent footer tokens.

## Examples

```text
feat: add permission validation to the users screen
```

```text
fix(api): correct empty response when listing kiosks
```

```text
feat(auth)!: change the hasPermission helper signature
```

```text
refactor: simplify pagination logic
```

```text
docs: update local setup instructions
```

```text
test: add tests for the useFeatureFlag hook
```

```text
chore: update development dependencies
```

```text
revert: revert change that broke page loading

Refs: a1b2c3d
```

## Reminder

Do not run `git add`, `git commit`, or `git push` unless the developer explicitly requests it. This skill only defines the required message format once a commit is requested.
