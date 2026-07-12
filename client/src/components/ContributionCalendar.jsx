import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2 } from 'lucide-react';
import Card from './Card';

const ContributionCalendar = () => {
  const [activityData, setActivityData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredCell, setHoveredCell] = useState(null);

  useEffect(() => {
    async function fetchActivity() {
      try {
        const response = await axios.get('/api/tasks/candidate/activity');
        setActivityData(response.data);
      } catch (err) {
        console.error('Failed to fetch calendar activity:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchActivity();
  }, []);

  if (loading) {
    return (
      <Card className="p-6 border border-zinc-850 bg-zinc-900/5 flex items-center justify-center h-[180px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="animate-spin text-purple-500" size={24} />
          <span className="text-xs text-zinc-500 font-medium">Loading contribution activity...</span>
        </div>
      </Card>
    );
  }

  // Generate grid days: Sunday of 52 weeks ago to Saturday of current week
  const today = new Date();
  const startOffset = 364 + today.getDay(); // Reach Sunday of 52 weeks ago
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - startOffset);

  const endOffset = 6 - today.getDay(); // Reach Saturday of current week
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + endOffset);

  const days = [];
  const curr = new Date(startDate);
  const activityMap = new Map(activityData.map(item => [item.date, item.completedTasks]));

  while (curr <= endDate) {
    const dateStr = curr.toISOString().split('T')[0];
    const isFuture = curr > today;
    const count = isFuture ? 0 : (activityMap.get(dateStr) || 0);
    
    days.push({
      date: new Date(curr),
      dateStr,
      count,
      isFuture
    });
    curr.setDate(curr.getDate() + 1);
  }

  // Generate Month Labels
  const monthLabels = [];
  let prevMonth = -1;
  const totalWeeks = days.length / 7;
  
  for (let w = 0; w < totalWeeks; w++) {
    const day = days[w * 7];
    const month = day.date.getMonth();
    if (month !== prevMonth) {
      monthLabels.push({
        label: day.date.toLocaleString('default', { month: 'short' }),
        colIndex: w
      });
      prevMonth = month;
    }
  }

  // Cell Color Logic
  const getCellColorClass = (count, isFuture) => {
    if (isFuture) return 'bg-zinc-950 border border-zinc-900/40 opacity-30';
    if (count === 0) return 'bg-zinc-900/60 border border-zinc-800/40 hover:border-zinc-700/60';
    if (count === 1) return 'bg-[#0e4429] border border-transparent';
    if (count >= 2 && count <= 3) return 'bg-[#006d32] border border-transparent';
    if (count >= 4 && count <= 5) return 'bg-[#26a641] border border-transparent';
    return 'bg-[#39d353] border border-transparent'; // 6+
  };

  const handleMouseEnter = (e, cell) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const containerRect = e.currentTarget.parentElement.getBoundingClientRect();
    
    setHoveredCell({
      ...cell,
      x: rect.left - containerRect.left + rect.width / 2,
      y: rect.top - containerRect.top - 8 // Shift 8px above cell
    });
  };

  return (
    <Card className="p-6 border border-zinc-850 bg-zinc-900/5 overflow-hidden select-none" hoverable={false}>
      {/* Scrollable Container Wrapper */}
      <div className="w-full overflow-x-auto scrollbar-thin pb-2">
        <div className="min-w-[690px] relative flex flex-col pt-6">
          
          {/* Month Labels row */}
          <div className="h-5 relative mb-1.5 text-[9px] text-zinc-550 font-bold uppercase tracking-wider">
            {monthLabels.map((lbl, idx) => (
              <span
                key={idx}
                className="absolute"
                style={{ left: `${(lbl.colIndex / totalWeeks) * 100}%` }}
              >
                {lbl.label}
              </span>
            ))}
          </div>

          <div className="flex">
            {/* Weekday labels */}
            <div className="grid grid-rows-7 gap-[3px] text-[9px] text-zinc-550 font-bold pr-2 h-[88px] sm:h-[95px] leading-none justify-end pt-[2.5px] uppercase tracking-wider w-8 shrink-0">
              <div></div>
              <div className="flex items-center">Mon</div>
              <div></div>
              <div className="flex items-center">Wed</div>
              <div></div>
              <div className="flex items-center">Fri</div>
              <div></div>
            </div>

            {/* Contribution Cells Grid */}
            <div className="relative flex-1">
              <div 
                className="grid grid-rows-7 grid-flow-col gap-[3.5px] h-[88px] sm:h-[95px]"
                onMouseLeave={() => setHoveredCell(null)}
              >
                {days.map((day, idx) => (
                  <div
                    key={idx}
                    onMouseEnter={(e) => handleMouseEnter(e, day)}
                    className={`w-[9px] h-[9px] sm:w-[10.5px] sm:h-[10.5px] rounded-[1.5px] sm:rounded-[2px] cursor-pointer transition-all duration-150 hover:scale-120 hover:z-10 ${getCellColorClass(day.count, day.isFuture)}`}
                  />
                ))}
              </div>

              {/* Float Hover Tooltip inside same container context */}
              <AnimatePresence>
                {hoveredCell && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, x: hoveredCell.x }}
                    animate={{ opacity: 1, y: 0, x: hoveredCell.x }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                    className="absolute z-30 bg-zinc-950 border border-zinc-800 px-3 py-2 rounded-xl text-[10px] leading-normal shadow-2xl pointer-events-none -translate-x-1/2 w-max"
                    style={{ 
                      top: hoveredCell.y,
                      transform: 'translateX(-50%) translateY(-100%)' // Shift upward so arrow aligns below
                    }}
                  >
                    {/* Tooltip Content */}
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-zinc-350">
                        {hoveredCell.date.toLocaleDateString('default', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className={hoveredCell.count > 0 ? 'text-green-400 font-bold' : 'text-zinc-500 font-semibold'}>
                        {hoveredCell.count > 0 
                          ? `Completed Tasks: ${hoveredCell.count}`
                          : 'No tasks completed'}
                      </span>
                    </div>
                    {/* Mini Arrow anchor */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-x-[4px] border-x-transparent border-t-[4px] border-t-zinc-800" />
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </div>

        </div>
      </div>
    </Card>
  );
};

export default ContributionCalendar;
