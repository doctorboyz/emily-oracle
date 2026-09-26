---
name: dependency-updater
description: |
  Safely update project dependencies with proper testing.
  Invoke with /update-deps or when dependencies need updates.
  Handles npm, pip, cargo, go mod, and other package managers.
---

# Dependency Updater

## Update Process

### Phase 1: Assessment
```
1. Check current versions
   - List all outdated packages
   - Note major/minor/patch updates

2. Review changelogs
   - Check for breaking changes
   - Review security advisories
   - Note deprecations

3. Assess impact
   - Core dependency vs dev dependency
   - Usage in codebase
   - Test coverage of affected areas
```

### Phase 2: Planning
```
1. Prioritize security updates first
2. Group patch updates together
3. Separate major version updates
4. Plan rollback strategy
```

### Phase 3: Execution
```
1. Update one group at a time
2. Run tests after each group
3. Commit with descriptive message
4. Update lockfile
```

### Phase 4: Validation
```
1. Run full test suite
2. Check for deprecated API usage
3. Verify build still works
4. Run security audit
5. Check bundle size impact (if applicable)
```

## Commands by Language

### JavaScript/TypeScript (npm/yarn/pnpm)
```bash
# Check outdated
npm outdated
yarn outdated
pnpm outdated

# Update patch/minor
npm update
yarn upgrade
pnpm update

# Update specific package
npm install package@latest
yarn upgrade package@latest
pnpm update package@latest

# Security audit
npm audit
npm audit fix
yarn audit
```

### Python (pip/poetry/pipenv)
```bash
# Check outdated
pip list --outdated
poetry show --outdated
pipenv update --dry-run

# Update package
pip install --upgrade package
poetry update package
pipenv update package

# Security check
pip-audit
safety check
```

### Rust (cargo)
```bash
# Check outdated
cargo outdated

# Update
cargo update
cargo update -p package

# Audit
cargo audit
```

### Go
```bash
# Check outdated
go list -u -m all

# Update
go get -u ./...
go get package@latest

# Tidy
go mod tidy
```

## Safety Rules

1. **Never update all dependencies at once**
   - Hard to identify which caused issues
   - Difficult rollback

2. **Update one major dependency at a time**
   - Isolate changes
   - Clear commit history

3. **Prefer minor/patch updates first**
   - Lower risk
   - Clear upgrade path

4. **Read changelogs before major updates**
   - Breaking changes
   - Migration guides
   - Deprecation notices

5. **Keep lockfile changes minimal**
   - Don't mix with code changes
   - Separate commit for lockfile

6. **Test after every update**
   - Unit tests
   - Integration tests
   - Manual smoke tests

## Commit Message Format

```
chore(deps): update [package] from [old] to [new]

- Update [package] [old] → [new]
- [Breaking change note if applicable]
- [Migration step if needed]

Changelog: [link to changelog]
Security: [CVE if applicable]
```

## Output Format

```
Dependency Update Report
========================

Security Updates: [X]
Major Updates: [X]
Minor Updates: [X]
Patch Updates: [X]

Recommended Order:
1. Security updates (critical first)
2. Patch updates (group together)
3. Minor updates (group by ecosystem)
4. Major updates (one at a time)

Breaking Changes Detected:
- package@version: [description]

Next Steps:
1. [specific action]
2. [specific action]
```

## Handling Issues

If tests fail after update:
1. Check for breaking changes in changelog
2. Review deprecation warnings
3. Update code for new API
4. Consider pinning if update is problematic
5. Document workaround if needed
