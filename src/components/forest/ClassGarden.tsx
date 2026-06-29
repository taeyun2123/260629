"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserData, DailyGoal } from "@/types";
import { TreePine, Sprout } from "lucide-react";

export default function ClassGarden({ user }: { user: UserData }) {
  const [classmates, setClassmates] = useState<UserData[]>([]);
  const [todayGoals, setTodayGoals] = useState<Record<string, DailyGoal>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Fetch classmates
    const usersQuery = query(
      collection(db, "users"),
      where("classCode", "==", user.classCode),
      where("role", "==", "STUDENT")
    );

    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs.map(doc => doc.data() as UserData);
      // Sort by studentId if available, otherwise by name
      usersData.sort((a, b) => {
        if (a.studentId && b.studentId) return a.studentId.localeCompare(b.studentId);
        return a.name.localeCompare(b.name);
      });
      setClassmates(usersData);
    });

    // 2. Fetch today's goals for the class
    const today = new Date().toISOString().split("T")[0];
    const goalsQuery = query(
      collection(db, "daily_goals"),
      where("classCode", "==", user.classCode),
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
  }, [user.classCode]);

  if (loading) return <div className="text-slate-500">텃밭을 불러오는 중...</div>;

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-emerald-950">우리 반 텃밭</h2>
        <span className="text-sm bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
          총 {classmates.length}명
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {classmates.map((mate) => {
            const isMe = mate.uid === user.uid;
            const hasVerified = !!todayGoals[mate.uid];

            if (!isMe && !hasVerified) {
              // 잠자는 씨앗 (미인증 타인)
              return (
                <div key={mate.uid} className="aspect-square bg-slate-50 rounded-2xl border border-emerald-100 flex flex-col items-center justify-center p-4 opacity-50 cursor-not-allowed">
                  <Sprout className="text-slate-400 mb-2" size={32} />
                  <span className="text-sm text-slate-400 font-medium text-center">잠자는 씨앗</span>
                </div>
              );
            }

            // 인증했거나 나인 경우
            const treeColor = hasVerified ? "text-teal-500" : "text-slate-400";
            const treeBg = hasVerified ? "bg-teal-500/10" : "bg-slate-100";
            const level = mate.treeLevel || 1;

            return (
              <div
                key={mate.uid}
                className={`aspect-square ${treeBg} rounded-2xl border ${hasVerified ? "border-teal-500/30" : "border-emerald-200"} flex flex-col items-center justify-center p-4 transition-transform hover:scale-105`}
              >
                <div className={`relative ${treeColor} mb-2`}>
                  <TreePine size={48} />
                  <div className="absolute -bottom-2 -right-2 bg-emerald-50 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold text-slate-700 shadow-sm shadow-emerald-100/50 border border-emerald-100">
                    Lv.{level}
                  </div>
                </div>
                <span className="text-sm font-semibold text-emerald-950 truncate w-full text-center">
                  {mate.name}
                </span>
                {hasVerified && (
                  <span className="text-xs text-cyan-500 mt-1 font-medium bg-emerald-50 px-2 py-0.5 rounded-full shadow-sm shadow-emerald-100/50">
                    인증 완료!
                  </span>
                )}
                {isMe && !hasVerified && (
                  <span className="text-xs text-slate-500 mt-1 font-medium">
                    아직 미인증
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
