"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { DailyGoal, UserData } from "@/types";
import { Image as ImageIcon, X } from "lucide-react";

interface GalleryItem extends DailyGoal {
  studentName: string;
}

export default function VerifiedGallery({ classCode }: { classCode: string }) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const goalsQuery = query(
      collection(db, "daily_goals"),
      where("classCode", "==", classCode),
      where("date", "==", today)
    );

    const unsubscribe = onSnapshot(goalsQuery, async (snapshot) => {
      const goals = snapshot.docs.map(d => ({ id: d.id, ...d.data() }) as DailyGoal);
      
      // Filter goals with photos
      const goalsWithPhotos = goals.filter(g => g.photoUrl);

      // Fetch student names (this is an N+1 issue ideally solved by duplicating name on goal or caching, but fine for small class sizes)
      const enhancedItems: GalleryItem[] = [];
      for (const goal of goalsWithPhotos) {
        const studentDoc = await getDoc(doc(db, "users", goal.studentUid));
        const name = studentDoc.exists() ? (studentDoc.data() as UserData).name : "알 수 없음";
        enhancedItems.push({ ...goal, studentName: name });
      }

      setItems(enhancedItems);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [classCode]);

  return (
    <div className="h-full flex flex-col">
      <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <ImageIcon size={20} className="text-point-blue" />
        오늘의 인증 사진
      </h2>

      {loading ? (
        <div className="flex-1 flex justify-center items-center text-sm text-gray-500">불러오는 중...</div>
      ) : items.length === 0 ? (
        <div className="flex-1 flex justify-center items-center text-sm text-gray-500">
          아직 올라온 사진이 없습니다.
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-3 pr-2">
          {items.map(item => (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer bg-gray-100"
            >
              <img src={item.photoUrl!} alt="인증샷" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-xs font-medium">{item.studentName}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Expanded Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl overflow-hidden max-w-2xl w-full">
            <button onClick={() => setSelectedItem(null)} className="absolute top-4 right-4 text-white bg-black/50 p-1 rounded-full hover:bg-black/70 z-10">
              <X size={24} />
            </button>
            <div className="bg-gray-900 w-full flex justify-center">
              <img src={selectedItem.photoUrl!} alt="인증샷 확대" className="max-h-[70vh] object-contain" />
            </div>
            <div className="p-5">
              <h3 className="font-bold text-lg mb-1">{selectedItem.studentName} 학생</h3>
              <p className="text-gray-700 font-medium mb-2">목표: {selectedItem.goalText}</p>
              {selectedItem.comment && (
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl italic">"{selectedItem.comment}"</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
