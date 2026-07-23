# PageHeader Component Documentation

The `PageHeader` is the canonical design system component for all page-level headers across the application. To ensure visual consistency and correct token consumption, **no page is allowed to declare its own `<h1>` or custom header padding/icon layouts**.

---

## Props

The component accepts the following props:

| Prop | Type | Default | Description |
|---|---|---|---|
| `icon` | `React.ReactNode` | `undefined` | Optional sidebar/header icon from `lucide-react`. Placed in standard container. |
| `title` | `React.ReactNode` | (Required) | Page title (bold, responsive size). |
| `description` | `React.ReactNode` | `undefined` | Optional subtitle or explanation text. |
| `actions` | `React.ReactNode` | `undefined` | Action buttons (AI triggers, save commands, print links, etc.). |
| `variant` | `'default' \| 'compact' \| 'centered' \| 'hero'` | `'default'` | Sizing and layout style preset. |
| `className` | `string` | `undefined` | Additional css custom classes. |

---

## Design System Tokens (globals.css)

All sizing, padding, and roundings are driven by tokens declared in `globals.css`:
- `--header-pt`: Top padding (`32px`)
- `--header-pb`: Bottom padding (`24px`)
- `--header-gap`: Spacer gap (`24px`)
- `--header-icon-size`: Icon box width/height (`56px`)
- `--header-icon-radius`: Rounding (`16px`)
- `--header-title-size`: Title size (`40px`)
- `--header-description-size`: Description size (`18px`)

---

## Variants & Usage

### 1. Default (Standard Page)
Used for standard pages.
```tsx
import { PageHeader } from '@/components/ui/PageHeader';
import { Sparkles, Button } from 'lucide-react';

<PageHeader
  icon={<Sparkles />}
  title="Smart Suggestions"
  description="Review AI-powered improvements for your resume."
  actions={<Button>Scan Resume</Button>}
/>
```

### 2. Compact (Select or Settings step)
Used for minor views, forms, or selection states.
```tsx
<PageHeader
  icon={<FileText />}
  title="Select a Resume"
  description="Choose which template you want to optimize."
  variant="compact"
/>
```

### 3. Centered (Empty or Welcome screens)
Used for blank states or full-screen loading/complete prompts.
```tsx
<PageHeader
  icon={<Target />}
  title="No Reports Yet"
  description="Run your first scan to generate an ATS Report."
  variant="centered"
/>
```

### 4. Hero (Dashboard Banner)
Used for promotional panels or primary dashboard landing banners.
```tsx
<PageHeader
  title="Welcome back!"
  description="Track your applications and resume scores in real time."
  variant="hero"
/>
```

---

## Do's and Don'ts

### Do's:
- ✅ Always use the `<PageHeader />` component on new pages.
- ✅ Pass proper icons from `lucide-react` directly to the `icon` prop.
- ✅ Group multiple actions under React fragments `<>...</>` to trigger the standardized flex layout wrapper.

### Don'ts:
- ❌ Never declare local `<h1>` tags for page headers.
- ❌ Never override the padding (`pt-8`, `pb-6`) or gaps on page titles.
- ❌ Do not hardcode heights on buttons within the header; the component's action container standardizes alignments dynamically.

---

## Design System Rule

> [!WARNING]
> **Page-level headers must never be implemented manually. Every page must use the shared PageHeader component. Any new page introducing a custom header implementation will be considered a design system violation.**

