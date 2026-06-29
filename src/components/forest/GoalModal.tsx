"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { UserData, DailyGoal } from "@/types";
import { X, Upload, CheckCircle2 } from "lucide-react";

export default function GoalModal({ user, onClose }: { user: UserData; onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingGoal, setExistingGoal] = useState<DailyGoal | null>(null);
  const [goalId, setGoalId] = useState<string | null>(null);

  const [goalText, setGoalText] = useState("");
  const [comment, setComment] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [error, setError] = useState("");

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const fetchTodayGoal = async () => {
      try {
        const q = query(
          collection(db, "daily_goals"),
          where("studentUid", "==", user.uid),
          where("date", "==", today)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const docData = snapshot.docs[0];
          const data = docData.data() as DailyGoal;
          setExistingGoal(data);
          setGoalId(docData.id);
          setGoalText(data.goalText || "");
          setComment(data.comment || "");
          setPhotoPreview(data.photoUrl || null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTodayGoal();
  }, [user.uid, today]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!goalText.trim()) {
      setError("오늘의 목표를 입력해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      let photoUrl = existingGoal?.photoUrl || null;

      // Upload new photo if selected
      if (photo) {
        const fileRef = ref(storage, `verifications/${user.classCode}/${user.uid}/${today}_${photo.name}`);
        await uploadBytes(fileRef, photo);
        photoUrl = await getDownloadURL(fileRef);
      }

      if (goalId) {
        // Update existing goal
        await updateDoc(doc(db, "daily_goals", goalId), {
          goalText,
          comment,
          photoUrl
        });
      } else {
        // Create new goal
        await addDoc(collection(db, "daily_goals"), {
          studentUid: user.uid,
          classCode: user.classCode,
          date: today,
          goalText,
          photoUrl,
          comment,
          rating: 0,
          createdAt: Date.now()
        });
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      setError("저장에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-emerald-50 p-6 rounded-2xl">불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-emerald-50 rounded-3xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-emerald-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-xl font-bold text-emerald-950 flex items-center gap-2">
            <SproutIcon className="text-teal-500" />
            오늘의 공부숲 가꾸기
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <form id="goal-form" onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">오늘의 공부 목표</label>
              <textarea
                required
                value={goalText}
                onChange={(e) => setGoalText(e.target.value)}
                placeholder="예: 수학 문제집 3장 풀기, 영어 단어 50개 외우기"
                className="w-full px-4 py-3 rounded-xl border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-primary-olive/50 focus:border-teal-500 transition-all resize-none h-24"
              />
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-emerald-100 space-y-4">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                <CheckCircle2 size={16} className="text-cyan-500" />
                목표 인증하기 (선택)
              </h3>
              
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2">인증 사진</label>
                <div className="flex items-center gap-4">
                  <label className="cursor-pointer border-2 border-dashed border-gray-300 hover:border-teal-500 rounded-xl p-4 flex flex-col items-center justify-center text-slate-500 transition-colors bg-emerald-50 w-32 h-32 flex-shrink-0">
                    <Upload size={24} className="mb-2" />
                    <span className="text-xs">사진 업로드</span>
                    <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                  </label>
                  {photoPreview && (
                    <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-emerald-200">
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2">한 줄 소감</label>
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="오늘 공부는 어땠나요?"
                  className="w-full px-4 py-3 rounded-xl border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-primary-olive/50 focus:border-teal-500 transition-all"
                />
              </div>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </form>
        </div>

        <div className="p-6 border-t border-emerald-100 flex justify-end gap-3 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-gray-200 transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            form="goal-form"
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl font-medium text-white bg-teal-500 hover:bg-teal-500-light transition-colors disabled:opacity-50"
          >
            {submitting ? "저장 중..." : "저장하기"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Inline sprout icon for modal header
function SproutIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 20h10" />
      <path d="M10 20c5.5-2.5.8-6.4 3-10" />
      <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z" />
      <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z" />
    </svg>
  );
}
