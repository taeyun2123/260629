"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { UserData } from "@/types";
import StudentDashboard from "@/components/forest/StudentDashboard";
import ClassGarden from "@/components/forest/ClassGarden";
import GoalModal from "@/components/forest/GoalModal";

export default function ForestPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data() as UserData;
          if (data.role !== "STUDENT") {
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-emerald-50 shadow-sm shadow-emerald-100/50 px-6 py-4 flex justify-between items-center border-b border-emerald-100">
        <div>
          <h1 className="text-2xl font-bold text-teal-500">우리 반 공부숲</h1>
          <p className="text-sm text-slate-500">{user.classCode} 반 - {user.name} 님 환영합니다!</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-teal-500 hover:bg-teal-500-light text-white px-6 py-3 rounded-2xl font-medium shadow-md shadow-emerald-200/50 transition-all flex items-center gap-2"
        >
          오늘의 공부숲 가꾸기
        </button>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6 flex flex-col lg:flex-row gap-6">
        {/* Left: Dashboard (30%) */}
        <aside className="w-full lg:w-[30%] bg-emerald-50 rounded-2xl shadow-sm shadow-emerald-100/50 p-6 border border-emerald-100">
          <StudentDashboard user={user} />
        </aside>

        {/* Right: Class Garden (70%) */}
        <section className="w-full lg:w-[70%] bg-emerald-50 rounded-2xl shadow-sm shadow-emerald-100/50 p-6 border border-emerald-100">
          <ClassGarden user={user} />
        </section>
      </main>

      {/* Goal Modal */}
      {isModalOpen && (
        <GoalModal
          user={user}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
