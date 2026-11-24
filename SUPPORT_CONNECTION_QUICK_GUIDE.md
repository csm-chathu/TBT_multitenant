# Support Connection Page - Quick Start Guide

## What's New

A new **Support Connection** page has been added to the TBT Dashboard that provides quick access to remote support tools like Screen Connect and TeamViewer.

## Access the Page

### Via Navigation
1. Login to TBT Dashboard
2. Look for **"Support Connection"** in the left sidebar (between Meta and Settings)
3. Click to access the page

### Via URL
Direct link: `http://your-domain/dashboard/support`

## Using the Support Tools

### View Available Tools
The page displays support tools as attractive tiles/cards:
- 🖥️ **Screen Connect** - Remote desktop access
- 👥 **TeamViewer** - Remote collaboration tool

### Copy Link
1. Click the **"Copy Link"** button on any tile
2. The link is copied to your clipboard
3. A confirmation message appears
4. Share the link with team members or customers

### Open Tool
1. Click the **"Open"** button on any tile
2. The tool opens in a new browser window
3. Proceed with your remote support session

## Features

✅ **Easy Access** - One-click access to support tools
✅ **Copy Functionality** - Share links with team members
✅ **Visual Feedback** - Toast notifications and button states
✅ **Responsive Design** - Works on desktop, tablet, and mobile
✅ **Role-Based Access** - Available for Super Admins, Agents, and Team Leads

## Customization (For Administrators)

### Update Support Tool URLs

Edit `TBT_ReactJS/src/pages/Dashboard/support/SupportConnection.tsx`

Find the `supportTiles` array and update:

```typescript
{
  id: 'screenconnect',
  link: 'https://your-actual-screenconnect-url.com' // Update this
}

{
  id: 'teamviewer',
  link: 'https://your-actual-teamviewer-url.com' // Update this
}
```

### Add New Support Tools

Add a new object to the `supportTiles` array:

```typescript
{
  id: 'newtoolfname',
  name: 'Tool Display Name',
  icon: '🎯',
  description: 'Tool description text',
  link: 'https://tool-url.com',
  color: '#FF0000',
  bgColor: '#FFE6E6',
}
```

**Color Examples:**
- Blue: `color: '#0066cc'`, `bgColor: '#e6f2ff'`
- Green: `color: '#10b981'`, `bgColor: '#d1fae5'`
- Purple: `color: '#7c3aed'`, `bgColor: '#ede9fe'`

## Information Section

The page includes a helpful guide:
1. Click "Open" to launch tools in a new window
2. Click "Copy Link" to share with team members
3. Use these tools for remote assistance and customer support

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Page not visible in sidebar | Verify user role (Super Admin, Agent, or Team Lead) |
| Copy Link not working | Try a different browser; check if clipboard is enabled |
| Links not opening | Verify URLs are correct and use https:// format |
| Page design looks broken | Clear browser cache and reload |

## Technical Details

- **Route**: `/dashboard/support`
- **Component**: `SupportConnection.tsx`
- **Location**: `TBT_ReactJS/src/pages/Dashboard/support/`
- **Access**: Super Admin, Agent, Team Lead roles
- **Build Status**: ✅ Successful

## Next Steps

1. **Update URLs** - Replace example URLs with actual support tool links
2. **Test** - Verify copy and open functionality works
3. **Add More Tools** - Follow the customization guide to add additional support tools
4. **Train Team** - Let your team know about the new Support Connection page

## Related Documentation

- Full Documentation: `SUPPORT_CONNECTION_PAGE_DOCUMENTATION.md`
- Component Source: `TBT_ReactJS/src/pages/Dashboard/support/SupportConnection.tsx`

---

**Last Updated**: 2026-11-23
**Version**: 1.0
**Status**: ✅ Ready for Production
