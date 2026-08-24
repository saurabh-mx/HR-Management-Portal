# Contributing Guidelines

We welcome contributions to the HR Management Portal! Please follow these guidelines to ensure a smooth collaboration process.

## Branching Strategy

We use a standard Git Flow branching model:
- `main`: Stable production branch.
- `dev` / `develop`: Integration branch for upcoming releases.
- `feature/[feature-name]`: Branches for developing new features.
- `bugfix/[bug-name]`: Branches for fixing bugs.

## Development Workflow

1. **Pull the latest changes** from the `dev` branch.
2. **Create a new branch** for your feature or bugfix:
   ```bash
   git checkout -b feature/awesome-new-tool
   ```
3. **Commit your changes** with clear, descriptive commit messages.
4. **Push your branch** and open a Pull Request against `dev`.

## Code Standards

- **Architecture**: Respect the Feature-Sliced Architecture. Do not pollute global folders (`src/components/ui`, `src/utils`) with feature-specific code. If it only applies to the Dashboard, put it in `src/features/Dashboard`.
- **TypeScript**: Use strict typing. Avoid using `any`. Create interfaces in the respective `types/` folder.
- **Styling**: Use Tailwind CSS utility classes. For complex variants, utilize the `cn` utility (clsx + tailwind-merge) provided in `src/lib/utils`.
- **Linting & Formatting**: Ensure your code passes all ESLint checks and is formatted correctly before pushing.

## Submitting a Pull Request

- Provide a clear title and description of the changes.
- Link any relevant issue numbers.
- Ensure the project builds successfully (`npm run build` or `npx tsc --noEmit`) with no TypeScript errors.
- Include screenshots or GIFs if the PR involves visual UI changes.
