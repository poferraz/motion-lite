# Rule: Review & Clean Up Codebase

## Description
When activated in Agent Mode, review the entire codebase for quality, consistency, and maintainability issues. Apply modern best practices, ensure code style alignment, remove unused code, and improve readability without altering core logic unless explicitly required.

## Scope
- **Files:** `src/**/*.{ts,tsx,js,jsx}`, `tests/**/*.{ts,tsx,js,jsx}`, config files
- **Ignore:** `node_modules`, build artifacts, auto-generated files

## Behavior
1. **Static Analysis**
   - Detect unused variables, imports, and functions.
   - Identify dead code or obsolete test cases.
   - Highlight inconsistent naming or style.
   - Flag large/complex functions for possible refactor.

2. **Code Modernization**
   - Use ESNext/TypeScript best practices.
   - Apply React 18+ standards (e.g., function components, hooks).
   - Ensure proper type safety.

3. **Test Quality**
   - Review failing or flaky tests for logic errors.
   - Suggest more robust queries for @testing-library/react.
   - Remove fragile selectors and prefer semantic queries.

4. **Performance & Maintainability**
   - Suggest optimizations for loops, rendering, and memoization.
   - Simplify over-engineered code.
   - Recommend splitting oversized components.

5. **Security & Environment**
   - Check for unsafe `any` usage.
   - Ensure no sensitive values are hardcoded.
   - Recommend `.env` usage and safe config loading.

6. **Accessibility**
   - Suggest WCAG-compliant improvements (aria-labels, semantic HTML).

## Output Format
When running in Agent Mode:
- Work one file at a time.
- Show **inline diffs** for each change.
- Explain each change briefly before applying.
- Stop after each file to allow user approval.

## Style Guide
- Follow Prettier defaults.
- ESLint: `@typescript-eslint` recommended rules.
- Import order: React first, external libs, local modules.
- Use named exports unless otherwise required.
