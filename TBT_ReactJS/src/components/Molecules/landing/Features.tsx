
import type React from "react"
import helpImg from "@/assets/Images/Landingpage/help.png"
import progressImg from "@/assets/Images/Landingpage/progress.png"
import heroImg from "@/assets/Images/Landingpage/heroimg.svg"

export const Features: React.FC = () => {
  return (
    <section className="py-16 md:py-24 bg-surface-secondary" id="features">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 md:gap-10">
          {/* Card 1: Real help, right when you need it */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 items-center">
            {/* Left Column: Text */}
            <div className="p-8 sm:p-12 lg:p-16 flex flex-col justify-center">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                Real help, right when you need it
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-slate-500 dark:text-slate-400 mt-5 leading-relaxed font-normal">
                No bots, no long queues a real TBT expert is on standby to solve your tech issues fast, day or night.
              </p>
            </div>

            {/* Right Column: Image */}
            <div className="w-full h-full min-h-[300px] sm:min-h-[360px] md:min-h-[400px]">
              <img
                src={helpImg}
                alt="Real help, right when you need it"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Card 2: Progress you can actually see */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 items-center">
            {/* Left Column: Image */}
            <div className="w-full h-full min-h-[300px] sm:min-h-[360px] md:min-h-[400px] order-2 md:order-1">
              <img
                src={progressImg}
                alt="Progress you can actually see"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Right Column: Text */}
            <div className="p-8 sm:p-12 lg:p-16 flex flex-col justify-center order-1 md:order-2">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                Progress you can actually see
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-slate-500 dark:text-slate-400 mt-5 leading-relaxed font-normal">
                Track every step by text or on our webportal, updated in real time so you're never left guessing.
              </p>
            </div>
          </div>

          {/* Card 3: User-friendly and intuitive system */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 items-center">
            {/* Left Column: Text */}
            <div className="p-8 sm:p-12 lg:p-16 flex flex-col justify-center">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                User-friendly and intuitive system
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-slate-500 dark:text-slate-400 mt-5 leading-relaxed font-normal">
                Our newly designed web portal has a simple but effective user interface. You can easily access your tickets in progress as well as your messages and projects.
              </p>
            </div>

            {/* Right Column: Full Image */}
            <div className="w-full h-full p-4 sm:p-6 lg:p-8 flex items-center justify-center bg-slate-50/50 dark:bg-slate-800/30">
              <img
                src={heroImg}
                alt="User-friendly and intuitive system"
                className="w-full h-auto object-contain rounded-2xl shadow-lg border border-slate-200/80 dark:border-slate-700/80"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}




