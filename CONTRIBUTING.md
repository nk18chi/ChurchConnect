# Contributing to ChurchConnect

Thank you for considering contributing to ChurchConnect Japan! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Documentation](#documentation)
- [Community](#community)

## Code of Conduct

This project adheres to Christian values of love, respect, and service. We expect all contributors to:

- **Be Respectful**: Treat everyone with respect and kindness
- **Be Constructive**: Provide helpful, constructive feedback
- **Be Collaborative**: Work together for the good of the community
- **Be Empathetic**: Show understanding and compassion toward others
- **Be Humble**: Acknowledge mistakes and learn from them

### Unacceptable Behavior

- Harassment, discrimination, or hate speech of any kind
- Trolling, insulting comments, or personal attacks
- Publishing others' private information
- Any conduct that violates the spirit of Christian community

### Reporting Issues

If you experience or witness unacceptable behavior, please contact:
- **Email**: conduct@churchconnect.jp
- **Response Time**: Within 48 hours

## Getting Started

### Prerequisites

Before contributing, ensure you have:

1. **Git** installed and configured
2. **Node.js 20+** installed
3. **pnpm 8.15.0+** installed
4. **PostgreSQL 14+** available (local or cloud)
5. **GitHub account** with SSH key configured

### First-Time Contributors

Welcome! Here's how to get started:

1. **Read the Documentation**
   - [README.md](README.md) - Project overview
   - [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) - Development setup
   - [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - System architecture

2. **Find an Issue**
   - Look for issues labeled `good first issue`
   - Check issues labeled `help wanted`
   - Review the [project board](https://github.com/yourusername/churchconnect/projects)

3. **Ask Questions**
   - Comment on the issue you're interested in
   - Ask questions in GitHub Discussions
   - Join our community channels

## Development Setup

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then:
git clone git@github.com:YOUR_USERNAME/churchconnect.git
cd churchconnect

# Add upstream remote
git remote add upstream git@github.com:ORIGINAL_OWNER/churchconnect.git
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Set Up Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your values
# See docs/ENVIRONMENT_SETUP.md for details
```

### 4. Set Up Database

```bash
cd packages/database
npx prisma migrate deploy
npx prisma db seed
cd ../..
```

### 5. Start Development Server

```bash
pnpm dev
```

Visit:
- Web: http://localhost:3000
- API: http://localhost:3001/graphql
- Church Portal: http://localhost:3002
- Admin: http://localhost:3003

### 6. Verify Setup

```bash
# Type check
pnpm type-check

# Lint
pnpm lint

# Build
pnpm build
```

If all commands succeed, you're ready to contribute!

## How to Contribute

### Types of Contributions

We welcome:

1. **Bug Fixes** - Fix issues or bugs
2. **Features** - Add new functionality
3. **Documentation** - Improve docs
4. **Tests** - Add or improve tests (when test infrastructure exists)
5. **Refactoring** - Improve code quality
6. **Design** - UI/UX improvements

### Contribution Workflow

1. **Find or Create an Issue**
   - Search existing issues
   - Create a new issue if needed
   - Get issue assigned to you

2. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix-name
   ```

3. **Make Changes**
   - Write code following our standards
   - Test your changes thoroughly
   - Update documentation if needed

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

5. **Push to Your Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create Pull Request**
   - Go to GitHub and create a PR
   - Fill out the PR template
   - Link related issues
   - Request review

7. **Address Review Feedback**
   - Make requested changes
   - Push additional commits
   - Respond to comments

8. **Merge**
   - Once approved, a maintainer will merge
   - Your contribution is live!

## Coding Standards

### TypeScript

**General Rules:**
- Use TypeScript strict mode
- Define types for all function parameters and return values
- Avoid `any` type (use `unknown` if truly needed)
- Use meaningful variable names
- Prefer `const` over `let`

**Good Example:**
```typescript
interface CreateChurchParams {
  name: string
  cityId: string
  denominationId: string
}

async function createChurch(
  params: CreateChurchParams
): Promise<Church> {
  return await prisma.church.create({
    data: params
  })
}
```

**Bad Example:**
```typescript
function createChurch(data: any) {
  return prisma.church.create({ data })
}
```

### React

**Component Guidelines:**
- Use functional components
- Use hooks for state management
- Keep components small and focused (<200 lines)
- Extract reusable logic into custom hooks
- Use Server Components when possible (Next.js)

**Good Example:**
```typescript
interface ChurchCardProps {
  church: {
    id: string
    name: string
    city: City
  }
}

export function ChurchCard({ church }: ChurchCardProps) {
  return (
    <div className="rounded-lg border p-4">
      <h3 className="text-lg font-semibold">{church.name}</h3>
      <p className="text-sm text-muted-foreground">
        {church.city.name}
      </p>
    </div>
  )
}
```

### Naming Conventions

**Files:**
- Components: `kebab-case.tsx` (e.g., `church-profile.tsx`)
- Utilities: `kebab-case.ts` (e.g., `format-date.ts`)
- Types: `kebab-case.ts` (e.g., `church-types.ts`)

**Code:**
- Components: `PascalCase` (e.g., `ChurchProfile`)
- Functions: `camelCase` (e.g., `getChurchById`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_UPLOAD_SIZE`)
- Types/Interfaces: `PascalCase` (e.g., `ChurchProfile`)

### Styling

**Tailwind CSS:**
- Use Tailwind utility classes
- Follow mobile-first responsive design
- Use design system colors and spacing
- Avoid custom CSS unless necessary

**Good Example:**
```typescript
<div className="flex flex-col gap-4 rounded-lg border p-6 md:flex-row">
  <h2 className="text-2xl font-bold">Title</h2>
</div>
```

**Bad Example:**
```typescript
<div style={{ display: 'flex', padding: '24px' }}>
  <h2 style={{ fontSize: '24px' }}>Title</h2>
</div>
```

### Code Organization

**File Structure:**
- Group related files together
- Keep files under 300 lines
- Use barrel exports (index.ts) for public APIs
- Separate concerns (UI, logic, types)

**Example Package Structure:**
```
packages/your-package/
├── src/
│   ├── index.ts           # Public API
│   ├── components/        # React components
│   ├── lib/              # Business logic
│   ├── types/            # TypeScript types
│   └── utils/            # Helper functions
├── package.json
└── tsconfig.json
```

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Commit Format

```
type(scope): subject

body (optional)

footer (optional)
```

### Commit Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring (no feature change)
- `perf`: Performance improvement
- `test`: Adding or updating tests
- `chore`: Build process, tooling, dependencies

### Examples

**Feature:**
```
feat(church-portal): add sermon upload feature

Allow church admins to upload sermons with YouTube links
and podcast URLs. Sermons are displayed on public profile.
```

**Bug Fix:**
```
fix(web): resolve search pagination bug

Fixed issue where pagination was not working correctly
on church search results page. Added proper offset calculation.
```

**Documentation:**
```
docs(readme): update installation instructions

Added steps for setting up Cloudinary and updated
environment variable examples.
```

**Chore:**
```
chore(deps): update Next.js to 14.1.0

Updated Next.js and related dependencies to latest versions.
No breaking changes.
```

### Commit Best Practices

- **Atomic Commits**: Each commit should be a single logical change
- **Clear Messages**: Write descriptive commit messages
- **Present Tense**: "add feature" not "added feature"
- **Imperative Mood**: "fix bug" not "fixes bug"
- **Reference Issues**: Include issue number in footer: `Fixes #123`

## Pull Request Process

### Before Creating a PR

- [ ] Code follows our style guidelines
- [ ] All tests pass (when applicable)
- [ ] Type checking passes (`pnpm type-check`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Build succeeds (`pnpm build`)
- [ ] Documentation is updated (if needed)
- [ ] Commits follow conventional commits format

### PR Title Format

Use conventional commit format:

```
feat(scope): add new feature
fix(scope): resolve bug
docs: update documentation
```

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring
- [ ] Other (please describe)

## Related Issues
Fixes #123
Relates to #456

## Changes Made
- List of changes
- Another change

## Testing
How to test these changes

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Commented complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added/updated (if applicable)
```

### Review Process

1. **Automated Checks**
   - TypeScript compilation
   - ESLint checks
   - Build verification

2. **Code Review**
   - At least one approval required
   - Reviewer checks:
     - Code quality
     - Performance implications
     - Security concerns
     - Documentation completeness

3. **Feedback**
   - Address reviewer comments
   - Push additional commits
   - Request re-review

4. **Merge**
   - Maintainer will merge when approved
   - Squash merge used (one commit per PR)
   - Branch deleted after merge

### Updating Your PR

If the main branch has moved ahead:

```bash
# Update your local main
git checkout main
git pull upstream main

# Rebase your branch
git checkout feature/your-feature
git rebase main

# Force push (if already pushed)
git push origin feature/your-feature --force
```

## Testing

### Manual Testing

Before submitting a PR:

1. **Test Your Changes**
   - Run the affected app
   - Test all modified functionality
   - Test on different browsers (Chrome, Firefox, Safari)
   - Test on mobile devices

2. **Test Critical Paths**
   - See [docs/TESTING.md](docs/TESTING.md)
   - Ensure no regressions

3. **Database Changes**
   - Test migrations up and down
   - Verify seed data works
   - Check for data loss issues

### Automated Tests (Future)

We plan to add:
- Unit tests (Vitest)
- Integration tests (React Testing Library)
- E2E tests (Playwright)

When implemented, all tests must pass before merge.

## Documentation

### When to Update Documentation

Update docs when you:
- Add a new feature
- Change existing functionality
- Fix a bug that affects documented behavior
- Add or change environment variables
- Modify database schema
- Add new dependencies

### Documentation Types

1. **Code Comments**
   - Document complex logic
   - Explain "why" not "what"
   - Use JSDoc for public APIs

2. **README Files**
   - Update app READMEs for app-specific changes
   - Update root README for major changes

3. **User Guides**
   - Update if user-facing features change
   - Add screenshots for UI changes

4. **Developer Docs**
   - Update architecture docs for design changes
   - Update deployment docs for infrastructure changes

### Documentation Style

- Use clear, concise language
- Include code examples
- Add diagrams for complex concepts
- Keep it up-to-date

## Community

### Getting Help

**Questions?**
- GitHub Discussions
- Issue comments
- Email: dev@churchconnect.jp

**Found a Bug?**
- Check existing issues
- Create a new issue with:
  - Clear description
  - Steps to reproduce
  - Expected vs actual behavior
  - Environment details

**Feature Request?**
- Create an issue with:
  - Clear description
  - Use case and benefits
  - Mockups or examples (if applicable)

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and discussions
- **Pull Requests**: Code review and technical discussions
- **Email**: Direct communication with maintainers

### Recognition

Contributors are recognized through:
- Listed in contributors section
- Mentioned in release notes
- Highlighted in community updates

Thank you for contributing to ChurchConnect! Together we're building something meaningful for the Christian community in Japan.

---

## Quick Reference

**Setup:**
```bash
git clone git@github.com:YOUR_USERNAME/churchconnect.git
cd churchconnect
pnpm install
cp .env.example .env
# Edit .env
cd packages/database && npx prisma migrate deploy && npx prisma db seed
cd ../.. && pnpm dev
```

**Before PR:**
```bash
pnpm type-check  # Must pass
pnpm lint        # Must pass
pnpm build       # Must pass
```

**Commit Format:**
```
type(scope): subject
```

**Need Help?**
- docs@churchconnect.jp
- GitHub Discussions

Thank you for contributing!
