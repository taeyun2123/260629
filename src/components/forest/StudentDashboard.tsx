"use client";

import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserData, DailyGoal } from "@/types";
import { Droplets } from "lucide-react";

export default function StudentDashboard({ user }: { user: UserData }) {
  const [goals, setGoals] = useState<DailyGoal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "daily_goals"),
      where("studentUid", "==", user.uid),
      orderBy("date", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedGoals = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })) as DailyGoal[];
      setGoals(fetchedGoals);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user.uid]);

  const handleRating = async (goalId: string, rating: number, date: string) => {
    // Only allow rating for today
    const today = new Date().toISOString().split("T")[0];
    if (date !== today) return;

    try {
      const goalRef = doc(db, "daily_goals", goalId);
      await updateDoc(goalRef, { rating });
    } catch (err) {
      console.error("Failed to update rating", err);
    }
  };

  if (loading) return <div className="text-gray-500">불러오는 중...</div>;

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">나의 공부 목표</h2>
      
      {goals.length === 0 ? (
        <div className="text-center text-gray-500 flex-1 flex items-center justify-center">
          아직 설정된 목표가 없어요.<br/>상단의 버튼을 눌러 목표를 세워보세요!
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
          {goals.map((goal) => {
            const today = new Date().toISOString().split("T")[0];
            const isToday = goal.date === today;
            
            return (
              <div key={goal.id} className="relative pl-6 border-l-2 border-gray-100">
                <div className="absolute w-3 h-3 bg-point-blue rounded-full -left-[7px] top-1.5" />
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="text-xs text-gray-400 mb-2">{goal.date} {isToday && "(오늘)"}</div>
                  <p className="text-gray-800 font-medium mb-3">{goal.goalText}</p>
                  
                  {goal.photoUrl && (
                    <div className="mb-3">
                      <img src={goal.photoUrl} alt="인증샷" className="w-full h-32 object-cover rounded-xl" />
                    </div>
                  )}
                  {goal.comment && (
                    <p className="text-sm text-gray-600 mb-3 bg-white p-2 rounded-lg italic">
                      "{goal.comment}"
                    </p>
                  )}

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500">내 평가:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          disabled={!isToday}
                          onClick={() => handleRating(goal.id, star, goal.date)}
                          className={`focus:outline-none ${isToday ? "cursor-pointer" : "cursor-default"}`}
                        >
                          <Droplets
                            size={20}
                            className={
                              star <= (goal.rating || 0)
                                ? "text-point-blue fill-point-blue"
                                : "text-gray-300"
                            }
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
