import type React from "react"

const Banner: React.FC = () => {
  return (
    <div className="bg-primary-600 text-white py-2 px-4 text-center text-sm">
      🎉 New Feature: Advanced ticket analytics now available!
      <a href="#" className="underline ml-2">
        Learn more
      </a>
    </div>
  )
}

export default Banner
