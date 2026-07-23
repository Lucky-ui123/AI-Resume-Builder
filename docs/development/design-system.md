# Design System Guidelines

This document outlines the design guidelines, layout rules, spacing tokens, and component specifications to ensure the application retains a single, unified visual language (similar to Linear, Notion, and Canva).

---

## 1. Spacing & Layout Rules

### Layout Wrappers
All dashboard pages must utilize `<PageContainer>` and `<PageContent>` layout structures. Individual pages **must not** define their own custom padding, margins, or max-widths.

- **PageContainer**: Enforces a standard wrapper `p-4 md:p-8 max-w-6xl mx-auto space-y-8 font-sans`.
- **PageContent**: Enforces standard vertical spacing `space-y-8`.

### CSS Spacing Tokens (globals.css)
All primary page spacing uses variables declared in the theme block:
- `--header-pt`: `32px` (Top padding)
- `--header-pb`: `24px` (Bottom padding)
- `--header-gap`: `24px` (Gaps and layout separations)

---

## 2. Typography Scale

All pages consume the Plus Jakarta Sans typeface with these unified sizing tokens:
- **Page Title**: `text-[var(--header-title-size)]` (40px, extra-bold)
- **Section Title**: `text-2xl` (24px, bold)
- **Card Title**: `text-lg` or `text-sm font-semibold`
- **Body Text**: `text-base` (16px) or `text-sm` (14px)
- **Muted text**: `text-muted-foreground`

---

## 3. Shared State Components

To standardize loading, empty, and error scenarios, we use a single component for each:

### 1. LoadingState
Renders a centered spinner and message box.
```tsx
import { LoadingState } from '@/components/ui/LoadingState';

<LoadingState message="Fetching your resumes..." />
```

### 2. EmptyState
Renders a standard icon box, title, description, and action button.
```tsx
import { EmptyState } from '@/components/ui/EmptyState';

<EmptyState
  icon={<FileText />}
  title="No resumes yet"
  description="Create your first resume to start matching with jobs."
  action={<Button>Create Resume</Button>}
/>
```

### 3. ErrorState
Unified error card indicating boundaries.
```tsx
import { ErrorState } from '@/components/ui/ErrorState';

<ErrorState
  title="Failed to Load"
  description="Please check your network and try again."
  onRetry={handleReload}
/>
```

---

## 4. Components & Buttons

- **Button Sizing**: Standard buttons use height 40px (`h-10`) with `rounded-md` or `rounded-xl`. Icon box margins are standardized to `mr-2`.
- **Card Standard**: Cards use `border-border/40` and `rounded-2xl` with a subtle hover drop-shadow.

---

## Do's and Don'ts

### Do's:
- ✅ Wrap every new dashboard page view in `<PageContainer>` and `<PageContent>`.
- ✅ Rely on `LoadingState`, `EmptyState`, and `ErrorState` components rather than local loaders/notices.
- ✅ Define margins, gaps, and sizes through design system classes.

### Don'ts:
- ❌ Never write ad-hoc `<h1>` tags for titles on standard pages.
- ❌ Do not hardcode raw paddings (e.g. `p-[23px]`, `pt-20`) for page contents.
- ❌ Do not mix multiple icon styles or stroke widths. Standardize on Lucide.
