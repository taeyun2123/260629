"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { updatePassword } from "firebase/auth";

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<"STUDENT" | "TEACHER">("STUDENT");
  const [classCode, setClassCode] = useState("");
  const [studentId, setStudentId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let loginEmail = email;
      
      // If student, construct the dummy email
      if (activeTab === "STUDENT") {
        if (!classCode || !studentId) {
          throw new Error("반 인증번호와 학번을 모두 입력해주세요.");
        }
        loginEmail = `${classCode}_${studentId}@studyforest.app`;
      }

      const userCredential = await signInWithEmailAndPassword(auth, loginEmail, password);
      const user = userCredential.user;

      // Fetch user role from Firestore
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        throw new Error("사용자 정보를 찾을 수 없습니다. 교사에게 문의하세요.");
      }

      const userData = userDoc.data();

      // Check role mismatch
      if (userData.role !== activeTab) {
        throw new Error(`선택하신 탭(${activeTab})과 계정 권한이 일치하지 않습니다.`);
      }

      // Check if student needs password change
      if (userData.role === "STUDENT" && userData.is_password_changed === false) {
        setShowPasswordChange(true);
        setLoading(false);
        return; // Don't redirect yet
      }

      // Set cookie and redirect
      document.cookie = `user_role=${userData.role}; path=/; max-age=86400`;
      
      if (userData.role === "TEACHER") {
        router.push("/teacher/dashboard");
      } else {
        router.push("/forest");
      }
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || "로그인에 실패했습니다. 정보를 확인해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (newPassword !== confirmPassword) {
      setError("새 비밀번호가 일치하지 않습니다.");
      return;
    }
    if (newPassword.length < 6) {
      setError("비밀번호는 6자리 이상이어야 합니다.");
      return;
    }
    
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("로그인 상태가 아닙니다.");

      await updatePassword(user, newPassword);
      
      // Update firestore
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        is_password_changed: true
      });

      document.cookie = `user_role=STUDENT; path=/; max-age=86400`;
      router.push("/forest");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "비밀번호 변경에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-olive mb-2">우리 반 공부숲</h1>
          <p className="text-gray-500">학급의 성장을 함께 가꾸어요</p>
        </div>

        {!showPasswordChange ? (
          <>
            <div className="flex bg-gray-100 rounded-xl p-1 mb-8">
              <button
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === "STUDENT" ? "bg-white shadow text-primary-olive" : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => { setActiveTab("STUDENT"); setError(""); }}
              >
                학생
              </button>
              <button
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === "TEACHER" ? "bg-white shadow text-primary-olive" : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => { setActiveTab("TEACHER"); setError(""); }}
              >
                선생님
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {activeTab === "STUDENT" ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">반 인증번호</label>
                    <input
                      type="text"
                      required
                      value={classCode}
                      onChange={(e) => setClassCode(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-olive/50 focus:border-primary-olive transition-all"
                      placeholder="예: 2024-3-1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">학번</label>
                    <input
                      type="text"
                      required
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-olive/50 focus:border-primary-olive transition-all"
                      placeholder="예: 01"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-olive/50 focus:border-primary-olive transition-all"
                    placeholder="teacher@school.com"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-olive/50 focus:border-primary-olive transition-all"
                  placeholder="••••••••"
                />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-olive hover:bg-primary-olive-light text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50 mt-4"
              >
                {loading ? "로그인 중..." : "로그인"}
              </button>
            </form>
          </>
        ) : (
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">새 비밀번호 설정</h2>
              <p className="text-sm text-gray-500 mt-2">초기 비밀번호를 안전한 새 비밀번호로 변경해주세요.</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">새 비밀번호</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-olive/50 focus:border-primary-olive transition-all"
                placeholder="6자리 이상"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 확인</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-olive/50 focus:border-primary-olive transition-all"
                placeholder="다시 한번 입력"
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-point-blue hover:bg-point-blue-light text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50 mt-4"
            >
              {loading ? "변경 중..." : "비밀번호 변경 완료"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
