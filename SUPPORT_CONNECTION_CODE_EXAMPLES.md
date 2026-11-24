# Support Connection Page - Code Examples & Snippets

## Quick Reference Code

### 1. Adding a New Support Tool

**Location**: `SupportConnection.tsx`, inside the `supportTiles` array

```typescript
{
  id: 'rds',
  name: 'Remote Desktop Services',
  icon: '🖥️',
  description: 'RDP connection for Windows remote access',
  link: 'https://rdp.yourcompany.com',
  color: '#6366f1',      // Indigo
  bgColor: '#e0e7ff',    // Light indigo
}
```

### 2. Customizing Colors

**Common Color Schemes:**

```typescript
// Blue - Professional
{ color: '#0066cc', bgColor: '#e6f2ff' }

// Green - Success
{ color: '#10b981', bgColor: '#d1fae5' }

// Purple - Premium
{ color: '#7c3aed', bgColor: '#ede9fe' }

// Orange - Warning
{ color: '#f97316', bgColor: '#fee2e2' }

// Red - Alert
{ color: '#dc2626', bgColor: '#fee2e2' }

// Cyan - Cool
{ color: '#00a4ef', bgColor: '#e0f7ff' }

// Pink - Vibrant
{ color: '#ec4899', bgColor: '#fce7f3' }
```

### 3. Using Lucide Icons Instead of Emoji

**Before (with emoji):**
```typescript
icon: '🖥️'
```

**After (with Lucide):**
```typescript
import { Monitor, Users, Headphones, Shield } from 'lucide-react'

// In component JSX:
<Monitor size={48} strokeWidth={1.5} />
```

**Available Lucide Icons for Support Tools:**
```typescript
// Communication
<Headphones /> // Support, customer service
<MessageSquare /> // Chat, messaging
<Phone /> // Phone support

// Remote Access
<Monitor /> // Desktop, screen
<Eye /> // Viewing, surveillance
<Radio /> // Connection, broadcast

// Tools & Features
<Settings /> // Configuration
<Wrench /> // Tools
<Shield /> // Security
<Lock /> // Access control
```

### 4. Modifying Button Styles

**Current Implementation:**
```typescript
{/* Copy Link Button */}
<button
  onClick={() => handleCopyLink(tile.link, tile.name)}
  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-primary-500 text-primary-500 hover:bg-primary-50 transition-colors"
>
  {copiedId === tile.name ? (
    <>
      <CheckCircle size={16} />
      Copied
    </>
  ) : (
    <>
      <Copy size={16} />
      Copy Link
    </>
  )}
</button>
```

**To Use Project Button Component:**
```typescript
import Button from '@/components/Atomic/Button'

<Button
  onClick={() => handleCopyLink(tile.link, tile.name)}
  style="Tertiary"
  className="flex-1"
>
  {copiedId === tile.name ? (
    <>
      <CheckCircle size={16} />
      Copied
    </>
  ) : (
    <>
      <Copy size={16} />
      Copy Link
    </>
  )}
</Button>
```

### 5. Integrating Backend API

**Current Implementation (Static Data):**
```typescript
const supportTiles: SupportTile[] = [
  { /* ... tile config ... */ },
]
```

**Future Backend Integration:**
```typescript
import { useEffect, useState } from 'react'
import api from '@/services/api'

export const SupportConnection = () => {
  const [supportTiles, setSupportTiles] = useState<SupportTile[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    api.get('/support-tools')
      .then(res => setSupportTiles(res.data))
      .catch(err => console.error('Failed to fetch support tools:', err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div>Loading...</div>

  return (
    // ... existing JSX ...
  )
}
```

### 6. Adding Validation for Links

```typescript
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

const handleOpenLink = (link: string) => {
  if (!isValidUrl(link)) {
    error('Invalid URL format')
    return
  }
  window.open(link, '_blank', 'noopener,noreferrer')
}
```

### 7. Adding Analytics Tracking

```typescript
// Track when a tool is accessed
const handleOpenLink = (link: string, toolName: string) => {
  // Log to analytics
  if (window.gtag) {
    window.gtag('event', 'support_tool_opened', {
      tool_name: toolName,
      timestamp: new Date().toISOString(),
    })
  }
  
  window.open(link, '_blank', 'noopener,noreferrer')
}

// Track when link is copied
const handleCopyLink = (link: string, tileName: string) => {
  navigator.clipboard.writeText(link)
  
  // Log to analytics
  if (window.gtag) {
    window.gtag('event', 'support_link_copied', {
      tool_name: tileName,
      timestamp: new Date().toISOString(),
    })
  }
  
  setCopiedId(tileName)
  success(`${tileName} link copied to clipboard!`)
  setTimeout(() => setCopiedId(null), 2000)
}
```

### 8. Adding Tool Categories

```typescript
interface SupportTile extends ... {
  category: 'remote-access' | 'communication' | 'monitoring' | 'other'
}

// In component:
const categories = ['remote-access', 'communication', 'monitoring', 'other']

return (
  <>
    {/* Filter buttons */}
    <div className="mb-6 flex gap-2 flex-wrap">
      {categories.map(cat => (
        <button
          key={cat}
          onClick={() => setSelectedCategory(cat)}
          className={`px-4 py-2 rounded-lg ${
            selectedCategory === cat
              ? 'bg-primary-500 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          {cat.replace('-', ' ').toUpperCase()}
        </button>
      ))}
    </div>

    {/* Filtered tiles */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {supportTiles
        .filter(tile => tile.category === selectedCategory)
        .map(tile => (
          // ... render tile ...
        ))}
    </div>
  </>
)
```

### 9. Improving Copy Feedback

```typescript
// Enhanced copy with better feedback
const handleCopyLink = async (link: string, tileName: string) => {
  try {
    // Copy to clipboard
    await navigator.clipboard.writeText(link)
    
    // Show success feedback
    setCopiedId(tileName)
    success(`${tileName} link copied!`)
    
    // Auto-reset after 2 seconds
    const timeout = setTimeout(() => {
      setCopiedId(null)
    }, 2000)
    
    return () => clearTimeout(timeout)
  } catch (err) {
    error('Failed to copy link. Please try again.')
    console.error('Copy failed:', err)
  }
}
```

### 10. Adding Tool Shortcuts

```typescript
// Add keyboard shortcuts for quick access
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    // Alt+S for Screen Connect
    if (e.altKey && e.key === 's') {
      e.preventDefault()
      window.open(supportTiles[0].link, '_blank')
    }
    
    // Alt+T for TeamViewer
    if (e.altKey && e.key === 't') {
      e.preventDefault()
      window.open(supportTiles[1].link, '_blank')
    }
  }
  
  window.addEventListener('keydown', handleKeyPress)
  return () => window.removeEventListener('keydown', handleKeyPress)
}, [supportTiles])
```

### 11. Responsive Customization

```typescript
// Different tile counts based on screen size
const getTileConfig = () => {
  const width = window.innerWidth
  
  if (width < 640) {
    return { columns: 1, gap: 4 } // Mobile
  } else if (width < 1024) {
    return { columns: 2, gap: 5 } // Tablet
  } else {
    return { columns: 3, gap: 6 } // Desktop
  }
}

// In component:
const tileConfig = getTileConfig()
```

### 12. Dark Mode Specific Styles

```typescript
{/* Tile with dark mode support */}
<div className="
  dark:bg-gray-800
  dark:border-gray-700
  dark:text-gray-100
">
  {/* Content */}
</div>

{/* Link display box with dark mode */}
<div className="
  p-3
  bg-gray-50
  dark:bg-gray-700
  rounded-lg
  border
  border-gray-200
  dark:border-gray-600
">
  <p className="text-xs text-gray-600 dark:text-gray-300">
    {tile.link}
  </p>
</div>
```

---

## Component Testing Examples

### Unit Test (Jest + React Testing Library)

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { SupportConnection } from './SupportConnection'
import * as clipboard from 'clipboard-polyfill'

// Mock clipboard
jest.mock('clipboard-polyfill')

describe('SupportConnection', () => {
  it('renders support tiles', () => {
    render(<SupportConnection />)
    expect(screen.getByText('Screen Connect')).toBeInTheDocument()
    expect(screen.getByText('TeamViewer')).toBeInTheDocument()
  })

  it('handles copy link click', async () => {
    render(<SupportConnection />)
    const copyButtons = screen.getAllByText(/Copy Link/i)
    
    fireEvent.click(copyButtons[0])
    expect(clipboard.writeText).toHaveBeenCalled()
  })

  it('handles open link click', () => {
    global.open = jest.fn()
    render(<SupportConnection />)
    
    const openButtons = screen.getAllByText('Open')
    fireEvent.click(openButtons[0])
    
    expect(global.open).toHaveBeenCalledWith(
      expect.any(String),
      '_blank',
      'noopener,noreferrer'
    )
  })
})
```

---

## Configuration Examples

### Environment Variables

```env
# .env
REACT_APP_SCREENCONNECT_URL=https://screenconnect.example.com
REACT_APP_TEAMVIEWER_URL=https://teamviewer.example.com
```

### Using Environment Variables

```typescript
const supportTiles: SupportTile[] = [
  {
    id: 'screenconnect',
    link: import.meta.env.VITE_SCREENCONNECT_URL || 'https://screenconnect.example.com',
    // ...
  },
  {
    id: 'teamviewer',
    link: import.meta.env.VITE_TEAMVIEWER_URL || 'https://teamviewer.example.com',
    // ...
  },
]
```

---

## Error Handling Examples

### Try-Catch Wrapper

```typescript
const handleCopyLink = async (link: string, tileName: string) => {
  try {
    await navigator.clipboard.writeText(link)
    setCopiedId(tileName)
    success(`${tileName} link copied!`)
    setTimeout(() => setCopiedId(null), 2000)
  } catch (err) {
    if (err instanceof Error) {
      error(`Failed to copy: ${err.message}`)
    } else {
      error('Failed to copy link')
    }
  }
}
```

---

## Performance Optimization

### Memoization

```typescript
import { useMemo } from 'react'

export const SupportConnection = () => {
  const supportTiles = useMemo(
    () => [
      { /* ... */ },
      { /* ... */ },
    ],
    [] // Empty dependency array - never changes
  )
  
  // ...
}
```

---

This document provides practical code examples for extending and customizing the Support Connection page.
