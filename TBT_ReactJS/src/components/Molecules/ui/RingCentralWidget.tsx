import { useEffect } from 'react'

const RC_CLIENT_ID = import.meta.env.VITE_RC_CLIENT_ID as string | undefined
const RC_SERVER = (import.meta.env.VITE_RC_SERVER as string | undefined) || 'https://platform.ringcentral.com'

function injectPositionStyle() {
  if (document.getElementById('rc-position-override')) return
  const style = document.createElement('style')
  style.id = 'rc-position-override'
  style.textContent = `
    #rc-widget-adapter-frame,
    #rc-widget,
    [id^="rc-widget"] {
      right: unset !important;
      left: 120px !important;
      bottom: -2px !important;
      margin-right: 12px !important;
    }
  `
  document.head.appendChild(style)
}

function findAndPosition() {
  const selectors = [
    '#rc-widget-adapter-frame',
    '#rc-widget',
    'iframe[name="rc-widget"]',
    '[id^="rc-widget"]',
  ]
  for (const sel of selectors) {
    const el = document.querySelector(sel) as HTMLElement | null
    if (el) {
      const target = el.tagName === 'IFRAME' ? (el.parentElement as HTMLElement) : el
      if (target) {
        target.style.setProperty('right',        'unset', 'important')
        target.style.setProperty('left',         '120px', 'important')
        target.style.setProperty('bottom',       '-2px',  'important')
        target.style.setProperty('margin-right', '12px',  'important')
        return true
      }
    }
  }
  return false
}

const RingCentralWidget: React.FC = () => {
  useEffect(() => {
    if (!RC_CLIENT_ID) return
    injectPositionStyle()
    if (document.getElementById('rc-embeddable-script')) return

    const script = document.createElement('script')
    script.id = 'rc-embeddable-script'
    script.src = 'https://ringcentral.github.io/ringcentral-embeddable/adapter.js'
    script.setAttribute('data-client-id', RC_CLIENT_ID)
    script.setAttribute('data-app-server', RC_SERVER)
    script.setAttribute('data-enable-analytics', 'false')
    script.setAttribute('data-enable-rcv', 'true')
    document.head.appendChild(script)

    const observer = new MutationObserver(() => {
      findAndPosition()
    })
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] })

    return () => observer.disconnect()
  }, [])

  return null
}

export default RingCentralWidget
