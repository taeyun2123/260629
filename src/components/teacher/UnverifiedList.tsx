"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserData } from "@/types";
import { Bell, BellRing } from "lucide-react";

export default function UnverifiedList({ classCode }: { classCode: string }) {
  const [unverifiedStudents, setUnverifiedStudents] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [nudgingIds, setNudgingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // We need both users and today's goals to find who is unverified
    const usersQuery = query(
      collection(db, "users"),
      where("classCode", "==", classCode),
      where("role", "==", "STUDENT")
    );

    const today = new Date().toISOString().split("T")[0];
    const goalsQuery = query(
      collection(db, "daily_goals"),
      where("classCode", "==", classCode),
      where("date", "==", today)
    );

    // Combine listeners
    let currentUsers: UserData[] = [];
    let verifiedUids = new Set<string>();

    const updateList = () => {
      const unverified = currentUsers.filter(u => !verifiedUids.has(u.uid));
      unverified.sort((a, b) => {
        if (a.studentId && b.studentId) return a.studentId.localeCompare(b.studentId);
        return a.name.localeCompare(b.name);
      });
      setUnverifiedStudents(unverified);
      setLoading(false);
    };

    const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
      currentUsers = snapshot.docs.map(doc => doc.data() as UserData);
      updateList();
    });

    const unsubGoals = onSnapshot(goalsQuery, (snapshot) => {
      verifiedUids = new Set(snapshot.docs.map(doc => doc.data().studentUid));
      updateList();
    });

    return () => {
      unsubUsers();
      unsubGoals();
    };
  }, [classCode]);

  const handleNudge = async (uid: string) => {
    setNudgingIds(prev => new Set(prev).add(uid));
    try {
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, { is_nudged: true });
      
      // Keep it showing as nudged for a brief moment before removing from state if needed
      setTimeout(() => {
        setNudgingIds(prev => {
          const next = new Set(prev);
          next.delete(uid);
          return next;
        });
      }, 2000);
    } catch (err) {
      console.error("Failed to send nudge", err);
      setNudgingIds(prev => {
        const next = new Set(prev);
        next.delete(uid);
        return next;
      });
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-emerald-950 flex items-center gap-2">
          <Bell size={20} className="text-yellow-500" />
          미인증 학생 ({unverifiedStudents.length}명)
        </h2>
      </div>

      {loading ? (
        <div className="flex-1 flex justify-center items-center text-sm text-slate-500">불러오는 중...</div>
      ) : unverifiedStudents.length === 0 ? (
        <div className="flex-1 flex flex-col justify-center items-center text-sm text-slate-500 bg-slate-50 rounded-xl border border-dashed border-emerald-200">
          <span className="text-2xl mb-2">🎉</span>
          전원 인증 완료!
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-2 space-y-2">
          {unverifiedStudents.map(student => {
            const isNudging = nudgingIds.has(student.uid);
            return (
              <div key={student.uid} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-emerald-100">
                <div>
                  <div className="font-medium text-emerald-950">{student.name}</div>
                  <div className="text-xs text-slate-500">학번: {student.studentId || "-"}</div>
                </div>
                <button
                  onClick={() => handleNudge(student.uid)}
                  disabled={student.is_nudged || isNudging}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    student.is_nudged
                      ? "bg-gray-200 text-slate-500 cursor-not-allowed"
                      : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                  }`}
                >
                  {student.is_nudged ? (
                    <>
                      <CheckIcon size={14} /> 알림 완료
                    </>
                  ) : isNudging ? (
                    "전송 중..."
                  ) : (
                    <>
                      <BellRing size={14} /> 독려하기
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CheckIcon(props: any) {
  return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>;
}
