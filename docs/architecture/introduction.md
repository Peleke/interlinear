# Introduction

This document outlines the complete fullstack architecture for **Interlinear**, including backend systems, frontend implementation, and their integration. It serves as the single source of truth for AI-driven development, ensuring consistency across the entire technology stack.

This unified approach combines what would traditionally be separate backend and frontend architecture documents, streamlining the development process for modern fullstack applications where these concerns are increasingly intertwined.

## Project Context

**Interlinear** is a Spanish reading comprehension tool that transforms static text into an interactive learning experience. Users paste Spanish text, click words to see definitions and hear pronunciations, and build a personal vocabulary list. The application is designed as a working demo/prototype to showcase AI-assisted development with proper testing practices.

## Starter Template

**Decision: Next.js 15 with TypeScript (Greenfield)**

The PRD explicitly specifies Next.js 15 as the foundation. This isn't based on a pre-existing starter, but we'll leverage:

- **Next.js 15 App Router** - Official framework with built-in optimizations
- **Supabase Quickstart** - For auth/database setup patterns
- **Tailwind CSS** - For rapid UI development with custom design system

**Constraints from PRD:**
- Must use Next.js 15 (App Router)
- TypeScript strict mode required
- 48-hour build timeline → simple, proven patterns only
- Tailwind for styling (custom warm/manuscript theme)

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-01-24 | 1.0 | Initial architecture document | Winston (Architect) |

---
