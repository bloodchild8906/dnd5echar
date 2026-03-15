# Contributing

Guidelines for contributing to the D&D 5e Character Sheet Manager.

## How to Contribute

### Reporting Bugs

1. Check [existing issues](https://github.com/Bloodchild8906/dnd5echar/issues) first
2. Use the [bug report template](https://github.com/Bloodchild8906/dnd5echar/issues/new?assignees=Bloodchild8906&labels=bug&projects=&template=bug_report.yml&title=%5BBug%5D%3A+)
3. Include:
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser and OS version
   - Screenshots if applicable

### Suggesting Features

1. Open a [feature request](https://github.com/Bloodchild8906/dnd5echar/issues/new)
2. Describe the use case clearly
3. Explain why it benefits users
4. Be open to discussion and iteration

### Pull Requests

1. **Fork** the repository
2. **Branch**: `git checkout -b feature/description` or `fix/description`
3. **Develop** with tests and documentation
4. **Commit** using [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` New feature
   - `fix:` Bug fix
   - `docs:` Documentation
   - `refactor:` Code change without feature/fix
   - `test:` Test additions/changes
   - `chore:` Build/tooling changes
5. **Push** and open a Pull Request

## Development Standards

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Configured for React + TypeScript
- **Prettier**: Format on save (configured in `.vscode/`)
- Pre-commit hooks run automatically

### Testing Requirements

- New features need tests
- Bug fixes need regression tests
- Maintain coverage above 80%

```bash
pnpm test        # Run all tests
pnpm test:watch  # Watch mode
```

### Component Guidelines

```typescript
// Functional components with explicit props
interface CharacterCardProps {
  character: Character;
  onSelect: (id: string) => void;
}

export function CharacterCard({ character, onSelect }: CharacterCardProps) {
  // Component logic
}
```

### State Management

- Use Zustand for global state
- Keep stores focused (single responsibility)
- Actions should handle persistence

### File Organization

```
src/
├── components/
│   ├── CharacterCard/
│   │   ├── index.tsx      # Component
│   │   ├── styles.css     # Scoped styles
│   │   └── types.ts       # Component types
│   └── __tests__/
│       └── CharacterCard.test.tsx
```

## Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

Examples:

```
feat(character): add inventory sorting

Allow players to sort inventory by name, type, or value.
Closes #123
```

```
fix(sync): handle offline Supabase errors

Gracefully degrade when sync fails due to network.
```

## Code Review Process

1. All PRs require at least one review
2. CI must pass (tests, lint, type-check)
3. Address feedback promptly
4. Squash commits if requested

## Areas for Contribution

### Priority Areas

- Accessibility improvements (a11y)
- Mobile responsiveness
- Performance optimizations
- Test coverage

### Documentation

- Wiki pages
- README updates
- Code comments for complex logic
- JSDoc for public APIs

### New Features

Check [open issues](https://github.com/Bloodchild8906/dnd5echar/issues) labeled `enhancement` or `help wanted`.

## Questions?

- Open a [discussion issue](https://github.com/Bloodchild8906/dnd5echar/issues/new)
- Check the [[Development Setup]] guide
- Review [[Architecture Overview]]

---

Thank you for contributing! 🎲
