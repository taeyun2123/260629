"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TrendingUp } from "lucide-react";

export default function WeeklyChart({ classCode }: { classCode: string }) {
  const [chartData, setChartData] = useState<{ date: string; rate: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Get total students count
        const usersQuery = query(
          collection(db, "users"),
          where("classCode", "==", classCode),
          where("role", "==", "STUDENT")
        );
        const usersSnapshot = await getDocs(usersQuery);
        const totalStudents = usersSnapshot.size || 1; // Prevent division by zero

        // 2. Generate last 7 days dates
        const dates: string[] = [];
        const dataMap: Record<string, number> = {};
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split("T")[0];
          dates.push(dateStr);
          dataMap[dateStr] = 0;
        }

        // 3. Fetch goals for these 7 days
        // Firestore doesn't support complex OR / IN queries nicely for 7 values without limitation,
        // but we can query by range if date is a string (YYYY-MM-DD).
        const goalsQuery = query(
          collection(db, "daily_goals"),
          where("classCode", "==", classCode),
          where("date", ">=", dates[0]),
          where("date", "<=", dates[6])
        );
        const goalsSnapshot = await getDocs(goalsQuery);
        
        goalsSnapshot.forEach(doc => {
          const data = doc.data();
          if (dataMap[data.date] !== undefined) {
            dataMap[data.date] += 1;
          }
        });

        // 4. Calculate rate
        const finalData = dates.map(date => {
          const count = dataMap[date];
          const rate = Math.round((count / totalStudents) * 100);
          return { date, rate: Math.min(rate, 100) };
        });

        setChartData(finalData);
      } catch (err) {
        console.error("Failed to load chart data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [classCode]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <TrendingUp size={20} className="text-point-blue" />
          최근 7일 인증률 추이
        </h2>
      </div>

      {loading ? (
        <div className="flex-1 flex justify-center items-center text-sm text-gray-500">차트를 불러오는 중...</div>
      ) : (
        <div className="flex-1 flex items-end gap-2 sm:gap-4 mt-2">
          {chartData.map((data, i) => {
            const shortDate = data.date.split("-").slice(1).join("/"); // MM/DD
            return (
              <div key={data.date} className="flex-1 flex flex-col justify-end items-center group h-full">
                <div className="w-full flex justify-center h-full items-end relative">
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap pointer-events-none">
                    {data.rate}%
                  </div>
                  {/* Bar */}
                  <div 
                    className="w-full max-w-[40px] bg-primary-olive/20 group-hover:bg-primary-olive/40 rounded-t-lg transition-all relative"
                    style={{ height: `${Math.max(data.rate, 5)}%` }} // min height 5% for visibility
                  >
                    <div 
                      className="absolute bottom-0 left-0 right-0 bg-primary-olive rounded-t-lg transition-all"
                      style={{ height: `${data.rate}%` }}
                    />
                  </div>
                </div>
                <div className="text-[10px] sm:text-xs text-gray-500 mt-2 whitespace-nowrap">
                  {i === 6 ? "오늘" : shortDate}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
