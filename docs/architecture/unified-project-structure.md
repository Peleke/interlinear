# Unified Project Structure

```
interlinear/
├── .github/workflows/           # CI/CD
├── apps/web/                    # Next.js 15 application
├── packages/
│   ├── shared/                  # Shared types & utilities
│   └── config/                  # Shared configs
├── infrastructure/              # OpenTofu IaC
├── scripts/                     # Build/deploy scripts
├── docs/                        # Documentation
├── .env.example
├── package.json                 # Root (workspaces)
└── README.md
```

---
