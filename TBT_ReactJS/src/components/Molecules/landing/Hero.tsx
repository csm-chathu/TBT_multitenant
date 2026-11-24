import type React from "react"
import Button from "../../Atomic/Button"

const Hero: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <h1 className="text-4xl md:text-6xl font-bold text-textColor-base leading-tight">
            Streamline Your
            <span className="text-primary-600"> Support</span>
            <br />
            Operations
          </h1>
          <p className="text-xl text-textColor-muted mt-6 leading-relaxed">
            Manage tickets, track issues, and deliver exceptional customer support with our comprehensive ticket
            management system.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Button href="/login" text="Get Started" className="text-lg px-8 py-3" />
            <Button href="/create-ticket" style="Tertiary" text="Submit Support Ticket" className="text-lg px-8 py-3 border border-primary-500/40 text-primary-400 hover:bg-primary-500/10 hover:text-primary-300" />
          </div>
        </div>

        <div className="relative">
          <img
            src="/tbt-ui-main/src/assets/Images/Landingpage/hero.jpg"
            alt="Dashboard Preview"
            className="rounded-lg shadow-2xl"
          />
        </div>
      </div>
    </div>
  )
}

export default Hero
