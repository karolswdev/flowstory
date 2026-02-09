# Contributing to FlowStory

Thanks for your interest in contributing! This guide will help you get started.

## Development Setup

### Prerequisites

- Node.js 20+
- npm 10+

### Getting Started

```bash
# Clone the repository
git clone https://github.com/karolswdev/flowstory.git
cd flowstory

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at http://localhost:5173

### Running Tests

```bash
# Unit tests
npm run test

# E2E tests (requires build first)
npm run build
npm run test:e2e

# All quality checks
npm run test:all
```

## Project Structure

```
src/
├── components/     # React components
│   ├── nodes/      # Custom node types
│   └── edges/      # Custom edge types
├── hooks/          # Custom React hooks
├── utils/          # Utilities (parser, export, layout)
├── schemas/        # Zod validation schemas
├── themes/         # Theme definitions
└── types/          # TypeScript type definitions

stories/            # Example YAML stories
e2e/                # Playwright E2E tests
```

## Making Changes

### Code Style

We use ESLint and Prettier to maintain consistent code style:

```bash
# Check linting
npm run lint

# Fix auto-fixable issues
npm run lint:fix

# Format code
npm run format
```

### Type Checking

```bash
npm run typecheck
```

### Commit Messages

Use clear, descriptive commit messages:

- `feat: add new node type for databases`
- `fix: correct edge label positioning`
- `docs: update YAML schema documentation`
- `refactor: simplify layout algorithm`
- `test: add tests for HTTP flow parser`

## Pull Request Process

1. **Fork the repository** and create your branch from `main`
2. **Make your changes** with appropriate tests
3. **Run all checks**: `npm run test:all`
4. **Update documentation** if needed
5. **Submit a pull request** with a clear description

### PR Checklist

- [ ] Tests pass locally (`npm run test:all`)
- [ ] Code follows existing style
- [ ] Documentation updated (if applicable)
- [ ] Commit messages are clear

## Adding New Story Types

To add a new visualization type:

1. Define the schema in `src/schemas/`
2. Create node components in `src/components/nodes/`
3. Add parser logic in `src/utils/parser.ts`
4. Create example stories in `stories/`
5. Add E2E tests in `e2e/`

## Reporting Issues

When reporting bugs, please include:

- Node.js and npm versions
- Browser and version
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable

## Questions?

Open a [discussion](https://github.com/karolswdev/flowstory/discussions) for questions or ideas.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
