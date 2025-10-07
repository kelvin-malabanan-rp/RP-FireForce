import { motion } from "framer-motion";

interface PieChartProps {
  data: Array<{
    label: string;
    value: number;
    color: string;
  }>;
  size?: number;
}

export function PieChart({ data, size = 200 }: PieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = size / 2 - 20;
  const center = size / 2;
  
  let cumulativePercentage = 0;
  
  const segments = data.map((item) => {
    const percentage = (item.value / total) * 100;
    const startAngle = (cumulativePercentage / 100) * 360;
    const endAngle = ((cumulativePercentage + percentage) / 100) * 360;
    
    cumulativePercentage += percentage;
    
    // Calculate path for the arc
    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;
    
    const x1 = center + radius * Math.cos(startAngleRad);
    const y1 = center + radius * Math.sin(startAngleRad);
    const x2 = center + radius * Math.cos(endAngleRad);
    const y2 = center + radius * Math.sin(endAngleRad);
    
    const largeArc = percentage > 50 ? 1 : 0;
    
    const pathData = [
      `M ${center} ${center}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ');
    
    return {
      ...item,
      percentage,
      pathData,
      startAngle,
      endAngle
    };
  });
  
  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} className="drop-shadow-sm">
        {segments.map((segment, index) => (
          <motion.path
            key={segment.label}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              delay: index * 0.2,
              duration: 0.6,
              ease: "easeOut"
            }}
            d={segment.pathData}
            fill={segment.color}
            stroke="white"
            strokeWidth="2"
            className="hover:opacity-80 transition-opacity cursor-pointer"
          />
        ))}
        
        {/* Center circle for donut effect */}
        <motion.circle
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          cx={center}
          cy={center}
          r={radius * 0.4}
          className="fill-white dark:fill-slate-900"
          stroke="white"
          strokeWidth="2"
        />
        
        {/* Center text */}
        <motion.text
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          x={center}
          y={center - 5}
          textAnchor="middle"
          className="text-sm font-bold fill-slate-900 dark:fill-white"
        >
          {total}
        </motion.text>
        <motion.text
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          x={center}
          y={center + 10}
          textAnchor="middle"
          className="text-xs fill-slate-500 dark:fill-slate-400"
        >
          Total
        </motion.text>
      </svg>
      
      {/* Legend */}
      <div className="space-y-2">
        {segments.map((segment, index) => (
          <motion.div
            key={segment.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + index * 0.1 }}
            className="flex items-center gap-2"
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: segment.color }}
            />
            <div className="text-sm">
              <span className="font-medium text-slate-900 dark:text-white">{segment.label}</span>
              <span className="text-slate-500 dark:text-slate-400 ml-2">
                {segment.value} ({segment.percentage.toFixed(1)}%)
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
