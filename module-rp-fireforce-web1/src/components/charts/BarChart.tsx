import { motion } from "framer-motion";

interface BarChartProps {
  data: Array<{
    label: string;
    value: number;
    color?: string;
  }>;
  maxValue?: number;
  height?: number;
}

export function BarChart({ data, maxValue, height = 200 }: BarChartProps) {
  const max = maxValue || Math.max(...data.map(d => d.value));
  
  return (
    <div className="w-full" style={{ height }}>
      <div className="flex items-end justify-between h-full gap-2 px-4 py-2">
        {data.map((item, index) => {
          const barHeight = (item.value / max) * (height - 60);
          
          return (
            <div key={item.label} className="flex flex-col items-center flex-1 max-w-16">
              {/* Value label on top */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.5 }}
                className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
              >
                {item.value}
              </motion.div>
              
              {/* Bar */}
              <div className="relative flex-1 w-full flex items-end">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: barHeight }}
                  transition={{ 
                    delay: index * 0.1,
                    duration: 0.8,
                    ease: "easeOut"
                  }}
                  className={`w-full rounded-t-md ${
                    item.color || 'bg-gradient-to-t from-blue-500 to-blue-400'
                  } shadow-sm`}
                  style={{ minHeight: '4px' }}
                />
              </div>
              
              {/* Label */}
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center leading-tight">
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
