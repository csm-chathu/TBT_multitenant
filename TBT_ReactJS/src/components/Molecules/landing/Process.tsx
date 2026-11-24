import { ChevronRight } from "lucide-react"
import type React from "react"

const Process: React.FC = () => {
  const steps = [
    {
      id: 1,
      title: "Create Tickets",
      description: "Easily create and categorize support tickets from multiple channels",
      image: "/tbt-ui-main/src/assets/Images/Landingpage/process-ticket.png",
      icon: "local_activity",
    },
    {
      id: 2,
      title: "Process & Assign",
      description: "Automatically route tickets to the right agents based on skills and workload",
      image: "/tbt-ui-main/src/assets/Images/Landingpage/process-text.png",
      icon: "assignment",
    },
    {
      id: 3,
      title: "Track & Resolve",
      description: "Monitor progress and ensure timely resolution with real-time updates",
      image: "/tbt-ui-main/src/assets/Images/Landingpage/process-watch.jpg",
      icon: "track_changes",
    },
  ]

  return (
    <div className="py-20 bg-surface-primary" id="how-it-works">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-textColor-base mb-2">How It Works</h2>
          <p className="text-xl text-textColor-muted max-w-3xl mx-auto">
            Our streamlined process ensures efficient ticket management from creation to resolution
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={step.id} className="relative">
              <div className="p-8 text-center">
                <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="material-symbols-outlined text-textColor-base text-4xl">{step.icon}</span>
                </div>
                <h3 className="text-xl font-semibold text-textColor-base mb-4">{step.title}</h3>
                <p className="text-textColor-muted mb-6">{step.description}</p>
                {/* <img src={step.image || "/placeholder.svg"} alt={step.title} className="rounded-lg shadow-md mx-auto" /> */}
              </div>

              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-20 -right-8 ">
                  <ChevronRight className="text-primary-400" size={32} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Process
