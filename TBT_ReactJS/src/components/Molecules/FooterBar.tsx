import type React from "react"
import Button from "../Atomic/Button"

const FooterBar: React.FC = () => {
  return (
    <div className="relative flex flex-col sm:flex-row items-center justify-between px-3 py-2">
      <p className="absolute left-1/2 -translate-x-1/2 text-textColor-muted">@copyrights TBT 2026 - Powered by eLife America</p>
      <div className="ml-auto">
        <Button href="mailto:support@elifeamerica.com" style="Text" text="Support" />
        <Button href="/terms" style="Text" text="Terms" />
        <Button href="/privacy" style="Text" text="Privacy" />
      </div>
    </div>
  )
}

export default FooterBar
