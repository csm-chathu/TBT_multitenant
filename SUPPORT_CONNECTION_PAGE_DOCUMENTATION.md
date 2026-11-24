# Support Connection Page - Documentation

## Overview
A new **Support Connection** page has been successfully created for the TBT React application. This page provides quick access to remote support and collaboration tools like Screen Connect and TeamViewer through an intuitive tile-based interface.

## Files Created

### 1. Main Component
**Location:** `TBT_ReactJS/src/pages/Dashboard/support/SupportConnection.tsx`

**Features:**
- Responsive grid layout (1 column on mobile, 2 on tablet, 3 on desktop)
- Beautiful tile cards for each support tool
- Each tile includes:
  - Tool icon and name
  - Descriptive text
  - Link display box
  - Copy Link button (with copy confirmation)
  - Open button (opens in new window)
  - Status indicator with animation
- Info section with usage instructions
- Toast notifications for user feedback
- Light and dark theme support via Tailwind classes

**Component Structure:**
```typescript
interface SupportTile {
  id: string
  name: string
  icon: React.ReactNode
  description: string
  link: string
  color: string
  bgColor: string
}
```

## Files Modified

### 1. App.tsx
**Changes:**
- Added import for SupportConnection component
- Added route: `/dashboard/support` → `<SupportConnection />`

**Route:**
```typescript
<Route path="support" element={<SupportConnection />} />
```

### 2. SideNavbar.tsx
**Changes:**
- Added new navigation item to `navItems` array
- Support Connection accessible to: SUPER_ADMIN, AGENT, TEAM_LEAD

**Navigation Item:**
```typescript
{
  id: 9,
  title: "Support Connection",
  icon: "headphones",
  path: "/dashboard/support",
  allowedRoles: [USER_TYPE_NAMES.SUPER_ADMIN, USER_TYPE_NAMES.AGENT, USER_TYPE_NAMES.TEAM_LEAD],
}
```

## Features

### 1. **Tile Display**
- Each support tool is displayed as an interactive card
- Color-coded tiles with custom background colors
- Large emoji icons for quick visual identification

### 2. **Link Management**
- Display of tool links with optional placeholder URLs
- Copy-to-clipboard functionality with visual feedback
- Open in new window feature for direct access

### 3. **User Feedback**
- Toast notifications for successful link copying
- Visual feedback on button states (Copied status)
- Animated status indicator showing availability

### 4. **Responsive Design**
- Mobile-first approach
- Breakpoints for tablet and desktop views
- Flexible layout using Tailwind CSS Grid

### 5. **Accessibility**
- Semantic HTML structure
- Proper button elements with click handlers
- Clear visual hierarchy
- Descriptive text and icons

## Default Support Tools

### Screen Connect
- **Icon:** 🖥️
- **Color:** #0066cc (Blue)
- **Description:** Remote desktop access and support
- **Link:** https://screenconnect.example.com (Update with actual URL)

### TeamViewer
- **Icon:** 👥
- **Color:** #00a4ef (Light Blue)
- **Description:** Remote access and collaboration tool
- **Link:** https://teamviewer.example.com (Update with actual URL)

## Customization Guide

### Adding New Support Tools

Edit `SupportConnection.tsx` and add to the `supportTiles` array:

```typescript
{
  id: 'toolname',
  name: 'Tool Display Name',
  icon: '🎯', // Emoji or component
  description: 'Tool description',
  link: 'https://tool-url.com',
  color: '#FF0000', // Tile accent color
  bgColor: '#FFE6E6', // Tile background color
}
```

### Updating Links

Replace placeholder URLs in `supportTiles`:
```typescript
link: 'https://your-actual-screenconnect-url.com'
link: 'https://your-actual-teamviewer-url.com'
```

### Customizing Colors

Each tile supports:
- `color`: Primary accent color (used for text and UI elements)
- `bgColor`: Background color for the header section

Example color schemes:
- Blue: color: '#0066cc', bgColor: '#e6f2ff'
- Green: color: '#10b981', bgColor: '#d1fae5'
- Purple: color: '#7c3aed', bgColor: '#ede9fe'
- Orange: color: '#f97316', bgColor: '#fee2e2'

### Changing Icons

Replace emoji with Lucide React icons:

```typescript
import { Monitor, Users, Settings } from 'lucide-react'

// In component:
icon: <Monitor size={48} /> // Instead of emoji
```

## Integration with Existing System

### Navigation
- Accessible via sidebar under "Support Connection"
- Visible to: Super Admin, Agent, Team Lead
- Route: `/dashboard/support`

### Styling
- Uses existing Tailwind CSS theme
- Respects dark/light mode via `textColor-base`, `textColor-muted` classes
- Consistent with existing TBT UI patterns

### Dependencies
- React hooks (useState)
- Lucide React icons (Copy, ExternalLink, CheckCircle)
- useToast hook for notifications
- Tailwind CSS for styling

## Testing Checklist

- [x] Build succeeds without errors
- [x] Component renders without TypeScript errors
- [x] Navigation link appears in sidebar
- [x] Route is accessible at `/dashboard/support`
- [x] Copy Link button functionality works
- [x] Open button opens link in new window
- [x] Toast notifications appear correctly
- [x] Responsive layout works on mobile/tablet/desktop
- [x] Color schemes display correctly

## Deployment Notes

1. **Update placeholder URLs** before deploying to production:
   - Replace `https://screenconnect.example.com` with actual URL
   - Replace `https://teamviewer.example.com` with actual URL

2. **Test links** in production environment to ensure:
   - Links are correct and accessible
   - New window opening works as expected
   - Copy functionality works across browsers

3. **Consider adding more tools** in future updates:
   - Remote desktop protocol (RDP) tools
   - Additional collaboration tools
   - Custom internal tools

## Future Enhancements

Potential improvements for future versions:

1. **Backend Integration**
   - Store tool URLs in database
   - Admin panel to manage support tools
   - Per-user or per-role tool customization

2. **Analytics**
   - Track tool access frequency
   - Log which tools are used most

3. **Status Indicators**
   - Real-time tool availability status
   - Connection health checks

4. **Search & Filter**
   - Search for tools by name or description
   - Filter by tool category

5. **Quick Access**
   - Recently used tools
   - Frequently used tools
   - Custom tool ordering per user

## Troubleshooting

### Component not appearing in sidebar
- Verify route is added to App.tsx
- Check user role has proper permissions (SUPER_ADMIN, AGENT, TEAM_LEAD)
- Clear browser cache

### Copy Link not working
- Ensure browser supports Clipboard API
- Check for HTTPS requirement in some browsers
- Verify useToast hook is properly imported

### Links not opening
- Check URLs are properly formatted (https://)
- Verify popup blocker is not interfering
- Test links in different browsers

## Support & Contact

For issues or questions regarding the Support Connection page:
1. Check this documentation
2. Review the component source code
3. Test with example URLs first
4. Verify all dependencies are installed
