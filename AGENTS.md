<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Page Header Design System Rule

- **PageHeader Usage**: Page-level headers must never be implemented manually. Every page must use the shared `PageHeader` component. Any new page introducing a custom header implementation will be considered a design system violation.

# Performance & Layout Rules

- **Lazy Loading**: Heavy client components (e.g., suggestions dashboards, rich text panels, or preview modals) must be loaded dynamically using Next.js `dynamic` (`next/dynamic`) imports to minimize the initial JS bundle size.
- **Visual Stability**: Avoid layout shifts (CLS) by utilizing standard wrappers (`PageContainer`, `PageContent`) and standard loaders (`LoadingState`) that occupy defined height blocks.


