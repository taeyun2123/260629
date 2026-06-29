"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { X } from "lucide-react";

interface FooterProps {
  termsContent: string;
  privacyContent: string;
}

export default function Footer({ termsContent, privacyContent }: FooterProps) {
  const [modalType, setModalType] = useState<"terms" | "privacy" | null>(null);

  const title = modalType === "terms" ? "이용약관" : "개인정보처리방침";
  const content = modalType === "terms" ? termsContent : privacyContent;

  return (
    <>
      <footer className="mt-auto py-4 bg-slate-50 border-t border-emerald-100 flex justify-center gap-6 text-sm text-slate-500">
        <button
          onClick={() => setModalType("terms")}
          className="hover:text-teal-500 transition-colors"
        >
          이용약관
        </button>
        <button
          onClick={() => setModalType("privacy")}
          className="hover:text-teal-500 transition-colors font-semibold"
        >
          개인정보처리방침
        </button>
      </footer>

      {/* Modal */}
      {modalType && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-xl border border-emerald-100">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 border-b border-emerald-100 bg-emerald-50/50 rounded-t-2xl">
              <h2 className="text-xl font-bold text-emerald-950">{title}</h2>
              <button
                onClick={() => setModalType(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto prose prose-sm max-w-none prose-emerald prose-headings:text-emerald-950 prose-a:text-teal-500">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
