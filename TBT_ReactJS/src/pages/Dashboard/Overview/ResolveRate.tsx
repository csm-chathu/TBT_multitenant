import type React from "react"
import { memo, useMemo } from "react"
import { Doughnut } from "react-chartjs-2"
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js"

ChartJS.register(ArcElement, Tooltip, Legend)

interface ResolveRateProps {
  resolvedPercent: number // 0-100
}

const ResolveRate: React.FC<ResolveRateProps> = ({ resolvedPercent }) => {
  const clamped = useMemo(() => Math.max(0, Math.min(100, resolvedPercent)), [resolvedPercent])
  
  const chartData = useMemo(() => ({
    datasets: [
      {
        backgroundColor: ["#3B82F6", "#DBEAFE"],
        data: [clamped, 100 - clamped],
        borderWidth: 0,
      },
    ],
  }), [clamped])

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: 50,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
      },
    },
  }), [])

  const resolveStyles = useMemo(() => ({
    width: "100%",
    position: "relative" as const,
  }), [])

  return (
    <div style={resolveStyles}>
      <Doughnut id="resolve" options={chartOptions} data={chartData} />
    </div>
  )
}

export default memo(ResolveRate)
