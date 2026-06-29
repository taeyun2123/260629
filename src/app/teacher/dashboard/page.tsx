"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { UserData } from "@/types";
import VerifiedGallery from "@/components/teacher/VerifiedGallery";
import TeacherGarden from "@/components/teacher/TeacherGarden";
import UnverifiedList from "@/components/teacher/UnverifiedList";
import WeeklyChart from "@/components/teacher/WeeklyChart";

export default function TeacherDashboard() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data() as UserData;
          if (data.role !== "TEACHER") {
            router.push("/login");
          } else {
            setUser(data);
          }
        } else {
          router.push("/login");
        }
      } else {
        router.push("/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-emerald-50 shadow-sm shadow-emerald-100/50 px-6 py-4 flex justify-between items-center border-b border-emerald-200">
        <div>
          <h1 className="text-2xl font-bold text-teal-500">우리 반 공부숲 - 교사 대시보드</h1>
          <p className="text-sm text-slate-500">{user.classCode} 반 - {user.name} 선생님</p>
        </div>
        <button
          onClick={() => auth.signOut()}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          로그아웃
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 flex flex-col gap-6 max-w-[1600px] mx-auto w-full">
        {/* Top 3 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[500px]">
          {/* Left: Gallery */}
          <div className="lg:col-span-1 bg-emerald-50 rounded-2xl shadow-sm shadow-emerald-100/50 border border-emerald-100 p-5 overflow-hidden flex flex-col">
            <VerifiedGallery classCode={user.classCode} />
          </div>

          {/* Center: Garden */}
          <div className="lg:col-span-2 bg-emerald-50 rounded-2xl shadow-sm shadow-emerald-100/50 border border-emerald-100 p-5 overflow-hidden flex flex-col">
            <TeacherGarden classCode={user.classCode} />
          </div>

          {/* Right: Unverified List */}
          <div className="lg:col-span-1 bg-emerald-50 rounded-2xl shadow-sm shadow-emerald-100/50 border border-emerald-100 p-5 overflow-hidden flex flex-col">
            <UnverifiedList classCode={user.classCode} />
          </div>
        </div>

        {/* Bottom: Chart */}
        <div className="bg-emerald-50 rounded-2xl shadow-sm shadow-emerald-100/50 border border-emerald-100 p-5 h-64">
          <WeeklyChart classCode={user.classCode} />
        </div>
      </main>
    </div>
  );
}
