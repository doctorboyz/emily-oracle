---
name: laravel-stack-patterns
description: Unified development patterns for Laravel, including security, testing, and verification. Use when working on Laravel/PHP backend projects.
---

# Laravel Stack Patterns

This skill unifies all Laravel-specific guidance into a single reference.

## 1. Core Architecture
- Use Eloquent ORM efficiently (avoid N+1).
- Keep controllers lean; use Service classes or Jobs for complex logic.

## 2. Testing & Verification
- Use Pest or PHPUnit for testing.
- Follow TDD patterns for feature development.
- Run verification loops before deployment.

## 3. Security
- Follow Laravel security best practices (CSRF, XSS, etc.).
- Use parameterized queries (default in Eloquent).
- Protect sensitive data and `.env` files.

---
*Refer to legacy skills for deep-dives:*
- `laravel-patterns`
- `laravel-security`
- `laravel-tdd`
- `laravel-verification`
