# System Architecture

The HR Management Portal employs a highly scalable **Feature-Sliced Architecture**. This ensures that as the application grows, components, state, and logic remain predictable and encapsulated.

## Directory Layout

```text
src/
├── app/                        # App entry point (main.tsx)
├── assets/                     # Static global assets (images, icons)
├── auth/                       # Security & Authentication Module
│   ├── components/             # Reusable Auth UI elements
│   ├── hooks/                  # Authentication-specific hooks
│   └── roles/                  # RBAC (Role-Based Access Control) matrix
├── components/                 # Global UI & Layouts
│   ├── ui/                     # Generic, stateless UI (e.g. Buttons, Cards)
│   ├── layouts/                # App-wide layouts (e.g. Sidebar, MainLayout)
│   └── common/                 # Reusable domain-agnostic components
├── constants/                  # Magic strings, configuration arrays, and global variables
├── docs/                       # Written static application data
├── features/                   # Core business logic (Encapsulated Modules)
│   ├── [FeatureName]/          # e.g., AdminPanel, LOAManagement, HRRequests
│   │   ├── api/                # API interactions for this feature
│   │   ├── components/         # UI elements exclusive to this feature
│   │   ├── hooks/              # Custom hooks for this feature
│   │   ├── types/              # TypeScript definitions for this feature
│   │   ├── utils/              # Helper functions specific to this feature
│   │   └── index.tsx           # Public export / Main feature page
├── hooks/                      # Global reusable React hooks
├── lib/                        # Pre-configured 3rd-party libraries (Supabase, query clients)
├── providers/                  # Global Context Providers (ThemeProvider, AuthProvider)
├── routes/                     # Application routing definitions
├── styles/                     # Tailwind directives, animations, and theme configurations
├── types/                      # Global TypeScript definitions
└── utils/                      # Global pure helper functions
```

## Architectural Principles

1. **High Cohesion, Low Coupling**: Code that changes together stays together. A feature (e.g., `AdminPanel`) contains all its specific UI, logic, and types.
2. **Strict Encapsulation**: Files inside `src/features/FeatureA` should never import internal components from `src/features/FeatureB`. If they need to share code, that code belongs in `src/components/common` or `src/utils`.
3. **Separation of Concerns**: UI rendering is separated from data fetching and state management. Context Providers wrap the app at the `src/providers` level, while route mapping happens purely in `src/routes`.
4. **Type Safety**: The entire application is strictly typed with TypeScript. All database models have corresponding types in `src/types`.
