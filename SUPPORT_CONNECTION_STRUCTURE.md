# Support Connection Page - Visual Structure

## Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Support Connections                                        │
│  Quick access to remote support and collaboration tools    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────┐ │
│  │   🖥️ TILE 1    │  │   👥 TILE 2    │  │   🎯 MORE  │ │
│  │  Screen        │  │  TeamViewer    │  │   Tools    │ │
│  │  Connect       │  │                │  │   (Future) │ │
│  └─────────────────┘  └─────────────────┘  └────────────┘ │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                                                        │ │
│  │  How to Use Support Tools                             │ │
│  │  1. Click "Open" to launch in new window              │ │
│  │  2. Click "Copy Link" to share with team              │ │
│  │  3. Use for remote assistance & customer support      │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Tile Card Structure

### Desktop View (lg: grid-cols-3)
```
┌─────────────────────────────────────┐
│                                     │
│        Tile Header                  │
│  ┌─────┐          ┌────────┐        │
│  │ 🖥️  │          │        │        │
│  └─────┘          │ Circle │        │
│                   │ Accent │        │
│        Tool Name  │        │        │
│  (Colored text)   └────────┘        │
│                                     │
├─────────────────────────────────────┤
│                                     │
│    Tool Description Text            │
│    "Remote desktop access and       │
│     support with Screen Connect"    │
│                                     │
│  ┌────────────────────────────────┐ │
│  │ Link Display Box               │ │
│  │ https://screenconnect.example  │ │
│  └────────────────────────────────┘ │
│                                     │
│  ┌──────────────┐  ┌────────────┐  │
│  │ Copy Link    │  │   Open     │  │
│  │ [icon]       │  │  [icon]    │  │
│  └──────────────┘  └────────────┘  │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  ● Available   (pulsing dot)        │
│                                     │
└─────────────────────────────────────┘
```

### Tablet View (md: grid-cols-2)
```
Two tiles per row
Increased spacing
Same tile structure as desktop
```

### Mobile View (grid-cols-1)
```
Single tile per row
Full width
Optimized touch targets
Same tile structure as desktop
```

## Component Hierarchy

```
SupportConnection (Page Component)
│
├── Header Section
│   ├── Page Title: "Support Connections"
│   └── Subtitle: "Quick access to remote support..."
│
├── Tiles Grid Container (Responsive)
│   │
│   ├── Tile Card 1 (Screen Connect)
│   │   ├── Tile Header
│   │   │   ├── Icon (🖥️)
│   │   │   ├── Accent Circle
│   │   │   └── Tool Name
│   │   │
│   │   ├── Tile Content
│   │   │   ├── Description Text
│   │   │   ├── Link Display Box
│   │   │   └── Button Container
│   │   │       ├── Copy Link Button
│   │   │       └── Open Button
│   │   │
│   │   └── Tile Footer
│   │       └── Status Indicator
│   │
│   ├── Tile Card 2 (TeamViewer)
│   │   └── [Same structure as Tile 1]
│   │
│   └── [Additional Tiles]
│
└── Info Section
    ├── Section Title
    └── Usage Instructions (Ordered List)
        ├── Step 1: Click Open
        ├── Step 2: Click Copy Link
        └── Step 3: Use for Support
```

## Color Palette

### Screen Connect Tile
- **Primary Color**: `#0066cc` (Blue)
- **Background Color**: `#e6f2ff` (Light Blue)
- **Text Color**: Inherits from theme (textColor-base, textColor-muted)

### TeamViewer Tile
- **Primary Color**: `#00a4ef` (Cyan)
- **Background Color**: `#e0f7ff` (Light Cyan)
- **Text Color**: Inherits from theme

### Common Colors
- **Border**: `border-gray-200` (Light Gray)
- **Background**: `bg-gray-50` (Off White)
- **Text Primary**: `text-textColor-base` (Theme-based)
- **Text Secondary**: `text-textColor-muted` (Theme-based)
- **Link/Button**: `primary-500`, `primary-600` (Theme accent)

## Responsive Breakpoints

```
Mobile     | Tablet      | Desktop
(< 768px)  | (768-1024)  | (> 1024px)
-----------|-------------|----------
1 column   | 2 columns   | 3 columns
Padding: 4 | Padding: 6  | Padding: 8
Gap: 6     | Gap: 6      | Gap: 6
```

## Interactive States

### Copy Link Button
```
Default State:
[📋 Copy Link]
Hover: bg-primary-50 (light background)

Clicked State (200ms):
[✓ Copied]
Style change to indicate success
```

### Open Button
```
Default State:
[🔗 Open] (colored background)
Hover: opacity-90 (slightly transparent)
Transition: smooth opacity change
```

### Tile Hover Effect
```
Default: shadow-sm
Hover: shadow-md
Transition: smooth shadow transition (300ms)
```

## Accessibility Features

- Semantic HTML buttons (not divs)
- Proper click handlers
- Visual feedback on interactions
- Clear text labels
- Color-blind friendly icons + text
- Keyboard navigable
- Screen reader compatible

## Data Flow

```
Component Mounts
│
├── Initialize State
│   └── copiedId: null
│
├── Define Support Tiles Data
│   ├── Screen Connect config
│   └── TeamViewer config
│
├── Render Grid
│   └── Map over supportTiles
│
└── Handle User Interactions
    ├── handleCopyLink()
    │   ├── Copy to clipboard
    │   ├── Show toast
    │   └── Update copiedId state
    │
    └── handleOpenLink()
        └── window.open() with new window params
```

## File Structure

```
TBT_ReactJS/
├── src/
│   ├── pages/
│   │   └── Dashboard/
│   │       └── support/
│   │           └── SupportConnection.tsx ✨ NEW
│   │
│   ├── App.tsx (modified - added route)
│   │
│   └── components/
│       └── Molecules/
│           └── ui/
│               └── SideNavbar.tsx (modified - added nav item)
│
└── [other files...]
```

## State Management

```
State:
  copiedId: string | null
    - Tracks which tile's copy button was clicked
    - Used for conditional rendering of "Copied" state
    - Resets after 2 seconds

Data:
  supportTiles: SupportTile[]
    - Immutable array of tool configurations
    - Used for rendering grid
    - Can be fetched from API in future
```

## Notes

- Each tile is independent
- No global state required (uses local React state)
- Toast notifications use existing useToast hook
- Fully responsive without media query CSS
- Uses Tailwind Grid for layout
- Compatible with light/dark theme
