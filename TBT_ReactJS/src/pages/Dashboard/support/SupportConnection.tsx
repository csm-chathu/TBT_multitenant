import { useState } from 'react'
import { Copy, ExternalLink, CheckCircle, Headphones, Users } from 'lucide-react'
import { useToast } from '@/hooks/useToast'

interface SupportTile {
  id: string
  name: string
  icon: React.ReactNode
  description: string
  link: string
  iconComponent: React.ReactNode
}

export const SupportConnection = () => {
  const { success } = useToast()
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const supportTiles: SupportTile[] = [
    {
      id: 'screenconnect',
      name: 'Screen Connect',
      icon: '🖥️',
      description: 'Remote desktop access and support',
      link: 'https://screenconnect.example.com',
      iconComponent: <Headphones size={20} className="text-primary-500" />,
    },
    {
      id: 'teamviewer',
      name: 'TeamViewer',
      icon: '👥',
      description: 'Remote access and collaboration tool',
      link: 'https://teamviewer.example.com',
      iconComponent: <Users size={20} className="text-primary-500" />,
    },
  ]

  const handleCopyLink = (link: string, tileName: string) => {
    navigator.clipboard.writeText(link)
    setCopiedId(tileName)
    success(`${tileName} link copied to clipboard!`)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleOpenLink = (link: string) => {
    window.open(link, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-textColor-base mb-3">
          Support Connections
        </h1>
        <p className="text-textColor-muted text-lg">
          Quick access to remote support and collaboration tools
        </p>
      </div>

      {/* Tiles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {supportTiles.map((tile) => (
          <div
            key={tile.id}
            className="rounded-lg border border-borderColor-secondary bg-surface-primary shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden"
          >
            {/* Tile Header */}
            <div className="p-6 border-b border-borderColor-secondary bg-surface-secondary">
              <div className="flex items-center justify-between mb-3">
                <span className="text-4xl">{tile.icon}</span>
                <div className="p-2 rounded-full bg-primary-100 flex items-center justify-center">
                  {tile.iconComponent}
                </div>
              </div>
              <h2 className="text-xl font-bold mb-1 text-primary-500">
                {tile.name}
              </h2>
            </div>

            {/* Tile Content */}
            <div className="p-6">
              <p className="text-textColor-muted text-sm mb-6">
                {tile.description}
              </p>

              {/* Link Display */}
              <div className="mb-6 p-3 bg-surface-secondary rounded-lg border border-borderColor-secondary">
                <p className="text-xs text-textColor-muted mb-2 font-medium">
                  Link
                </p>
                <p className="text-xs text-textColor-base break-all font-mono">
                  {tile.link}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleCopyLink(tile.link, tile.name)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-primary-500 text-primary-500 hover:bg-primary-100 dark:hover:bg-primary-400 dark:hover:bg-opacity-20 transition-colors"
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
                <button
                  onClick={() => handleOpenLink(tile.link)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors"
                >
                  <ExternalLink size={16} />
                  Open
                </button>
              </div>
            </div>

            {/* Footer Status */}
            <div className="px-6 py-3 bg-surface-secondary border-t border-borderColor-secondary">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                <span className="text-xs text-textColor-muted">
                  Available
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info Section */}
      <div className="mt-12 p-6 bg-surface-secondary border border-borderColor-secondary rounded-lg">
        <h3 className="text-lg font-semibold text-textColor-base mb-3">
          How to Use Support Tools
        </h3>
        <ul className="space-y-2 text-textColor-muted text-sm">
          <li className="flex gap-3">
            <span className="font-bold text-primary-500 min-w-fit">1.</span>
            <span>
              Click &quot;Open&quot; to launch the support tool in a new window
            </span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold text-primary-500 min-w-fit">2.</span>
            <span>
              Or click &quot;Copy Link&quot; to share the link with team members
            </span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold text-primary-500 min-w-fit">3.</span>
            <span>
              Use these tools for remote assistance and customer support
            </span>
          </li>
        </ul>
      </div>
    </div>
  )
}

