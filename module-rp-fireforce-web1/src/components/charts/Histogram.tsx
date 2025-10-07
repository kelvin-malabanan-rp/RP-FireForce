import { motion } from "framer-motion";

interface HistogramProps {
  data: Array<{
    range: string;
    count: number;
    color?: string;
  }>;
  title?: string;
  height?: number;
}

export function Histogram({ data, title, height = 180 }: HistogramProps) {
  const maxCount = Math.max(...data.map(d => d.count));
  
  return (
    <div className="w-full">
      {title && (
        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
          {title}
        </h4>
      )}
      
      <div className="flex items-end justify-between gap-1" style={{ height }}>
        {data.map((item, index) => {
          const barHeight = (item.count / maxCount) * (height - 40);
          
          return (
            <div key={item.range} className="flex flex-col items-center flex-1">
              {/* Count label */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.3 }}
                className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
              >
                {item.count}
              </motion.div>
              
              {/* Bar */}
              <div className="relative flex-1 w-full flex items-end">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: barHeight }}
                  transition={{ 
                    delay: index * 0.1,
                    duration: 0.6,
                    ease: "easeOut"
                  }}
                  className={`w-full ${
                    item.color || 'bg-gradient-to-t from-purple-500 to-purple-400'
                  } shadow-sm`}
                  style={{ minHeight: '2px' }}
                />
              </div>
              
              {/* Range label */}
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
                {item.range}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* X-axis line */}
      <div className="border-t border-slate-200 dark:border-slate-700 mt-2" />
    </div>
  );
}
