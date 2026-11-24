import type React from "react"
import { memo, useMemo } from "react"
import { Doughnut } from "react-chartjs-2"
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js"

ChartJS.register(ArcElement, Tooltip, Legend)

interface TicketChartProps {
  data: number[] // [low, medium, high, critical]
}

const TicketChart: React.FC<TicketChartProps> = ({ data }) => {
  // Priority colors matching the priority chip colors: Low (success), Medium (info), High (warning), Critical (danger)
  const priorityColors = useMemo(() => ["#22c55e", "#3b82f6", "#ffc961", "#ff7761"], [])
  
  // Check if all data values are 0 (empty state) - memoized
  const isEmpty = useMemo(() => {
    const total = data.reduce((sum, val) => sum + val, 0)
    return total === 0
  }, [data])
  
  // For empty state, show a single gray segment - memoized
  const chartData = useMemo(() => ({
    datasets: [
      {
        backgroundColor: isEmpty ? ["#e5e7eb"] : priorityColors,
        data: isEmpty ? [1] : data,
        borderWidth: 0,
      },
    ],
  }), [isEmpty, priorityColors, data])

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: 60,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: !isEmpty,
      },
    },
  }), [isEmpty])

  const ticketStyles = useMemo(() => ({
    position: "relative" as const,
  }), [])

  return <Doughnut id="tickets" style={ticketStyles} options={chartOptions} data={chartData} />
}

export default memo(TicketChart)
