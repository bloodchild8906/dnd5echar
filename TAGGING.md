# GitHub Actions Workflow Tags

This document describes the tagging system used to trigger GitHub Actions workflows.

## Overview

Most workflows in this repository are triggered by pushing specific tags. This allows for controlled, on-demand execution of CI/CD pipelines without requiring branch-based triggers.

## Available Tags

| Tag | Workflow | Description |
|-----|----------|-------------|
| `Publish` | 🚀 CI - Publish Build | Full CI pipeline + build artifact for production release |
| `Test` / `test` | 🧪 Test Suite | Run test suite with coverage reporting |
| `Lint` / `lint` | 🧹 Lint & Format | Run ESLint and Prettier checks |
| `Type-Check` / `type-check` | 🔵 Type Check | TypeScript type checking |
| `Coverage` / `coverage` | 📊 Coverage Report | Generate test coverage reports |
| `Size` / `size` | 📏 Size Check | Bundle size analysis |
| `Build` / `build` | 🏗️ Build Only | Quick build preview (non-production) |
| `Analyze` / `analyze` | 🔬 Build Analyze | Bundle analysis with visualization |
| `Format` / `format` | 💅 Format Check | Prettier formatting validation |
| `Docs` / `docs` | 📚 Generate Documentation | TypeDoc documentation generation |
| `Knip` / `knip` | ✂️ Knip - Unused Code Detection | Find unused files and dependencies |
| `Deps` / `deps` | 📦 Dependency Check | Check for outdated dependencies and security issues |
| `Env` / `env` | 🌍 Environment Validation | Validate environment configuration |

## Automatic Workflows

The following workflows run automatically without requiring tags:

| Workflow | Trigger | Description |
|----------|---------|-------------|
| 🔍 PR - Code Quality Checks | Pull Request to `main` or `development` | Combined type-check, lint, format, test, and size check |
| 🚀 Deploy to Vercel | After successful `🚀 CI - Publish Build` | Deploy to Vercel production |
| 🏷️ Release | Manual workflow_dispatch | Create a new release with version bump |

## Scheduled Workflows

Some workflows also run on a schedule:

| Workflow | Schedule | Description |
|----------|----------|-------------|
| ✂️ Knip | Weekly (Sunday) | Find unused code |
| 📦 Dependency Check | Weekly (Monday) | Check for dependency updates and security issues |

## Usage Examples

### Push a tag to trigger a workflow

```bash
# Run tests
git tag Test
git push origin Test

# Run linting
git tag Lint
git push origin Lint

# Full CI + production build
git tag Publish
git push origin Publish
```

### Delete a tag after use

```bash
# Delete local tag
git tag -d Test

# Delete remote tag
git push origin :refs/tags/Test
```

### Force push a tag (re-run workflow)

```bash
# Update tag to current commit and push
git tag -f Test
git push -f origin Test
```

## Tag Naming Conventions

- Use **PascalCase** for multi-word tags (e.g., `Type-Check`, `Publish`)
- Each tag has a lowercase alias (e.g., `type-check`, `publish`)
- Tags are **case-sensitive** in Git but workflows accept both variants
- Keep tags **short and descriptive** (max 20 characters recommended)

## Workflow Summary Table

| Workflow | Tag Required | Manual Trigger | Auto Trigger | Schedule |
|----------|-------------|----------------|--------------|----------|
| 🚀 CI - Publish Build | `Publish` | ✓ | ✗ | ✗ |
| 🧪 Test Suite | `Test` | ✓ | ✗ | ✗ |
| 🧹 Lint & Format | `Lint` | ✓ | ✗ | ✗ |
| 🔵 Type Check | `Type-Check` | ✓ | ✗ | ✗ |
| 📊 Coverage Report | `Coverage` | ✓ | ✗ | ✗ |
| 📏 Size Check | `Size` | ✓ | ✗ | ✗ |
| 🏗️ Build Only | `Build` | ✓ | ✗ | ✗ |
| 🔬 Build Analyze | `Analyze` | ✓ | ✗ | ✗ |
| 💅 Format Check | `Format` | ✓ | ✗ | ✗ |
| 📚 Generate Documentation | `Docs` | ✓ | ✗ | ✗ |
| ✂️ Knip | `Knip` | ✓ | ✗ | Weekly (Sun) |
| 📦 Dependency Check | `Deps` | ✓ | ✗ | Weekly (Mon) |
| 🌍 Environment Validation | `Env` | ✓ | ✗ | ✗ |
| 🔍 PR - Code Quality Checks | N/A | ✗ | PR to main/dev | ✗ |
| 🚀 Deploy to Vercel | N/A | ✗ | After CI success | ✗ |
| 🏷️ Release | N/A | workflow_dispatch | ✗ | ✗ |

## Creating Custom Tags

To add a new workflow with tag support:

1. Define the trigger in the workflow YAML:
   ```yaml
   on:
     push:
       tags:
         - 'YourTag'
         - 'yourtag'
     workflow_dispatch:
   ```

2. Update this documentation with the new tag

3. Consider adding both PascalCase and lowercase variants for convenience
