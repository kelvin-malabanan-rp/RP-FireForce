import { motion } from "framer-motion";

interface LineChartProps {
  data: Array<{
    label: string;
    value: number;
  }>;
  height?: number;
  color?: string;
}

export function LineChart({ data, height = 200, color = "stroke-blue-500" }: LineChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;
  
  // Fixed dimensions that look good
  const svgWidth = 600;
  const svgHeight = height;
  const padding = 50;
  const chartWidth = svgWidth - (padding * 2);
  const chartHeight = svgHeight - (padding * 2);
  
  // Calculate points for the line
  const points = data.map((item, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth;
    const y = padding + chartHeight - ((item.value - minValue) / range) * chartHeight;
    return { x, y, value: item.value, label: item.label };
  });
  
  // Create path string for the line
  const pathData = points.map((point, index) => 
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ');
  
  // Create area path for gradient fill
  const areaPath = `${pathData} L ${points[points.length - 1].x} ${svgHeight - padding} L ${padding} ${svgHeight - padding} Z`;
  
  return (
    <div className="w-full flex justify-center">
      <svg 
        width={svgWidth} 
        height={svgHeight} 
        className="max-w-full h-auto"
      >
        {/* Grid lines */}
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" className="stop-blue-500 stop-opacity-30" />
            <stop offset="100%" className="stop-blue-500 stop-opacity-5" />
          </linearGradient>
        </defs>
        
        {/* Y-axis grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
          <line
            key={index}
            x1={padding}
            y1={padding + chartHeight * ratio}
            x2={svgWidth - padding}
            y2={padding + chartHeight * ratio}
            className="stroke-slate-200 dark:stroke-slate-700"
            strokeWidth="1"
            strokeDasharray="3,3"
          />
        ))}
        
        {/* X-axis grid lines */}
        {points.map((point, index) => (
          <line
            key={index}
            x1={point.x}
            y1={padding}
            x2={point.x}
            y2={svgHeight - padding}
            className="stroke-slate-100 dark:stroke-slate-800"
            strokeWidth="0.5"
            strokeDasharray="2,2"
          />
        ))}
        
        {/* Area fill */}
        <motion.path
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          d={areaPath}
          fill="url(#lineGradient)"
        />
        
        {/* Main line */}
        <motion.path
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          d={pathData}
          fill="none"
          className={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Data points */}
        {points.map((point, index) => (
          <motion.g key={index} className="group">
            <motion.circle
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
              cx={point.x}
              cy={point.y}
              r="5"
              className="fill-white dark:fill-slate-900 cursor-pointer hover:scale-110 transition-transform"
              stroke={color.replace('stroke-', '')}
              strokeWidth="2"
            />
            
            {/* Hover tooltip - hidden by default, shown on group hover */}
            <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <rect
                x={point.x - 18}
                y={point.y - 30}
                width="36"
                height="20"
                rx="6"
                className="fill-slate-800 dark:fill-slate-200"
                opacity="0.95"
              />
              <text
                x={point.x}
                y={point.y - 17}
                textAnchor="middle"
                className="text-xs fill-white dark:fill-slate-900 font-semibold"
              >
                {point.value}
              </text>
            </g>
          </motion.g>
        ))}
        
        {/* X-axis labels */}
        {points.map((point, index) => (
          <text
            key={index}
            x={point.x}
            y={svgHeight - 15}
            textAnchor="middle"
            className="text-sm fill-slate-600 dark:fill-slate-400 font-medium"
          >
            {point.label}
          </text>
        ))}
        
        {/* Y-axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
          <text
            key={index}
            x={padding - 15}
            y={padding + chartHeight * ratio + 5}
            textAnchor="end"
            className="text-sm fill-slate-600 dark:fill-slate-400 font-medium"
          >
            {Math.round((minValue + (maxValue - minValue) * (1 - ratio)) * 10) / 10}
          </text>
        ))}
        
        {/* Chart border */}
        <rect
          x={padding}
          y={padding}
          width={chartWidth}
          height={chartHeight}
          fill="none"
          className="stroke-slate-300 dark:stroke-slate-600"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
}
