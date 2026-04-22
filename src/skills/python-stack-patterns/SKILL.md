---
name: python-stack-patterns
description: Comprehensive Python development patterns including core idioms, testing, security, and Django/Web framework standards. Use when working on Python projects for anything from script automation to full-stack Django applications.
---

# Python Stack Patterns

This skill combines core Python patterns, testing strategies, and Django framework standards into a single, unified reference.

## 1. Core Python Patterns
- Follow PEP 8 standards.
- Use type hints for all public APIs.
- Prefer list comprehensions and generators for efficient data processing.

## 2. Testing Strategies
- **pytest** is the preferred test runner.
- Use fixtures for shared setup and teardown.
- Mock external dependencies using `unittest.mock` or `pytest-mock`.
- Aim for 80%+ test coverage.

## 3. Django Framework Standards
- **Fat Models, Thin Views**: Keep business logic in models or dedicated service layers.
- Use Class-Based Views (CBVs) for standard CRUD operations.
- Always use the Django ORM safely to prevent SQL injection.
- **TDD in Django**: Use `pytest-django` and `factory_boy` for robust testing.

## 4. Security & Best Practices
- Never commit `.env` files or secrets.
- Use `pip-audit` to check for vulnerable dependencies.
- Follow Django security guidelines (CSRF, XSS, etc.).

---
*Refer to the following legacy skills for detailed deep-dives if needed:*
- [python-patterns](../python-patterns/SKILL.md)
- [python-testing](../python-testing/SKILL.md)
- [django-patterns](../django-patterns/SKILL.md)
- [django-tdd](../django-tdd/SKILL.md)
