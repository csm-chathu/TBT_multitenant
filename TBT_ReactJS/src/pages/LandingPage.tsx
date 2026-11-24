import type React from "react"
import Hero from "../components/Molecules/landing/Hero"
import NavigationBar from "../components/Molecules/landing/NavigationBar"
import Process from "../components/Molecules/landing/Process"
import { Features } from "@/components/Molecules/landing/Features"
import { Footer } from "@/components/Molecules/landing/Footer"

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-surface-secondary">
        <NavigationBar />
        <Hero />
        <Process />
        <Features />
        <Footer />
    </div>
  )
}

export default LandingPage
