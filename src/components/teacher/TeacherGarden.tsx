"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserData, DailyGoal } from "@/types";
import { TreePine, Sprout } from "lucide-react";

export default function TeacherGarden({ classCode }: { classCode: string }) {
  const [classmates, setClassmates] = useState<UserData[]>([]);
  const [todayGoals, setTodayGoals] = useState<Record<string, DailyGoal>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const usersQuery = query(
      collection(db, "users"),
      where("classCode", "==", classCode),
      where("role", "==", "STUDENT")
    );

    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs.map(doc => doc.data() as UserData);
      usersData.sort((a, b) => {
        if (a.studentId && b.studentId) return a.studentId.localeCompare(b.studentId);
        return a.name.localeCompare(b.name);
      });
      setClassmates(usersData);
    });

    const today = new Date().toISOString().split("T")[0];
    const goalsQuery = query(
      collection(db, "daily_goals"),
      where("classCode", "==", classCode),
      where("date", "==", today)
    );

    const unsubscribeGoals = onSnapshot(goalsQuery, (snapshot) => {
      const goalsMap: Record<string, DailyGoal> = {};
      snapshot.docs.forEach(doc => {
        const goal = doc.data() as DailyGoal;
        goalsMap[goal.studentUid] = goal;
      });
      setTodayGoals(goalsMap);
      setLoading(false);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeGoals();
    };
  }, [classCode]);

  if (loading) return <div className="text-gray-500">텃밭을 불러오는 중...</div>;

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">학급 텃밭 현황</h2>
        <div className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full flex gap-2">
          <span>총 {classmates.length}명</span>
          <span className="font-semibold text-primary-olive">
            완료 {Object.keys(todayGoals).length}명
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {classmates.map((mate) => {
            const goal = todayGoals[mate.uid];
            const hasVerified = !!goal;
            const level = mate.treeLevel || 1;

            return (
              <div
                key={mate.uid}
                className={`aspect-square rounded-2xl border ${
                  hasVerified ? "bg-primary-olive/10 border-primary-olive/30" : "bg-gray-50 border-gray-200"
                } flex flex-col items-center justify-center p-3 relative group`}
              >
                <div className={`relative mb-2 ${hasVerified ? "text-primary-olive" : "text-gray-400"}`}>
                  {hasVerified ? <TreePine size={40} /> : <Sprout size={40} />}
                  <div className="absolute -bottom-1 -right-2 bg-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold text-gray-700 shadow-sm border border-gray-100">
                    Lv.{level}
                  </div>
                </div>
                
                <span className="text-xs font-semibold text-gray-800 truncate w-full text-center">
                  {mate.name}
                </span>
                
                {hasVerified ? (
                  <span className="text-[10px] text-white mt-1 bg-primary-olive px-2 py-0.5 rounded-full">
                    인증완료
                  </span>
                ) : (
                  <span className="text-[10px] text-gray-500 mt-1 bg-gray-200 px-2 py-0.5 rounded-full">
                    미인증
                  </span>
                )}

                {/* Tooltip for goal text */}
                {hasVerified && goal.goalText && (
                  <div className="absolute hidden group-hover:block z-10 bottom-full mb-2 bg-gray-800 text-white text-xs p-2 rounded-lg w-40 text-center shadow-lg pointer-events-none">
                    {goal.goalText}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
