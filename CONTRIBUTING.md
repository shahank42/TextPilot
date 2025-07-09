# Contributing to TextPilot

We welcome contributions to this project! Whether it's a bug report, a new feature, or a documentation improvement, your help is greatly appreciated. Please take a moment to review this guide to make the contribution process as smooth as possible.

# Stack

- **TypeScript** - For type safety and improved developer experience

- **TanStack Router** - File-based routing with full type safety

- **TailwindCSS** - Utility-first CSS for rapid UI development

- **shadcn/ui** - Reusable UI components

- **Hono** - Lightweight, performant server framework

- **oRPC** - End-to-end type-safe APIs with OpenAPI integration

- **Bun** - Runtime environment

- **Biome** - Linting and formatting

- **Turborepo** - Optimized monorepo build system

## To be used

- **Drizzle** - TypeScript-first ORM

- **SQLite/Turso** - Database engine

- **Tauri** - Build native desktop applications

## Getting Started

First, install the dependencies:

```bash
bun install
```

## Database Setup

This project uses SQLite with Drizzle ORM.

1. Start the local SQLite database:

```bash
cd apps/server && bun db:local
```

2. Update your `.env` file in the `apps/server` directory with the appropriate connection details if needed.

3. Apply the schema to your database:

```bash
bun db:push
```

Then, run the development server:

```bash
bun dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser to see the web application.

The API is running at [http://localhost:3000](http://localhost:3000).

## Project Structure

```
text-pilot/
├── apps/
│ ├── web/     # Frontend application (React + TanStack Router)
│ └── server/  # Backend API (Hono, ORPC)
```

## Available Scripts

- `bun dev`: Start all applications in development mode

- `bun build`: Build all applications

- `bun dev:web`: Start only the web application

- `bun dev:server`: Start only the server

- `bun check-types`: Check TypeScript types across all apps

- `bun db:push`: Push schema changes to database

- `bun db:studio`: Open database studio UI

- `cd apps/server && bun db:local`: Start the local SQLite database

- `bun check`: Run Biome formatting and linting

- `cd apps/web && bun desktop:dev`: Start Tauri desktop app in development

- `cd apps/web && bun desktop:build`: Build Tauri desktop app

# How to Report Bugs

If you find a bug, please help us by submitting an [issue](https://github.com/shahank42/TextPilot/issues). Before creating a new issue, please check if a similar issue already exists.

When reporting a bug, please include:

- A clear and concise description of the bug.

- Steps to reproduce the behavior.

- Expected behavior.

- Screenshots or error messages, if applicable.

- Your operating system and browser/environment details.

# How to Suggest Features

If you have a feature request, please open an [issue](https://github.com/shahank42/TextPilot/issues) and describe your idea.

When suggesting a feature, please include:

- A clear and concise description of the proposed feature.

- Why you think this feature would be beneficial to the project.

- Any potential use cases or examples.

# Pull Request Guidelines

We welcome pull requests! To ensure a smooth review process, please follow these guidelines:

- Fork the repository and create your branch from main.

- Make your changes in a new Git branch: git checkout -b feature/your-feature-name or git checkout -b bugfix/your-bugfix-name.

- Ensure your code adheres to the project's coding style. Run bun check to automatically format and lint your code.

- Write clear, concise commit messages.

- Test your changes thoroughly. If applicable, add new tests or update existing ones.

- Update documentation if your changes affect the project's functionality or usage.

- Open a pull request to the main branch. Provide a clear description of your changes and reference any related issues.

# Licensing

By contributing to this project, you agree that your contributions will be licensed under its MIT License.
