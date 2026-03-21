"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface MeetingData {
  preferred_date: string;
  preferred_time: string;
  method: string;
  contact_phone: string;
  memo: string;
}

const TIME_SLOTS = [
  "10:00", "10:30", "11:00", "11:30",
  "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30",
  "17:00",
];

const METHODS = ["화상 미팅 (Google Meet)", "전화 미팅", "대면 미팅"];

export function MeetingCard({
  projectId,
  existingMeeting,
  onBooked,
}: {
  projectId: string;
  existingMeeting?: {
    preferred_date: string;
    preferred_time: string;
    method: string;
    contact_phone: string;
    status: string;
    meet_link?: string | null;
  } | null;
  onBooked?: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBooked, setIsBooked] = useState(!!existingMeeting);
  const [bookedData, setBookedData] = useState(existingMeeting);

  const [form, setForm] = useState<MeetingData>({
    preferred_date: "",
    preferred_time: "",
    method: "",
    contact_phone: "",
    memo: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/projects/${projectId}/meeting`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        const data = await res.json();
        setIsBooked(true);
        setBookedData({
          preferred_date: form.preferred_date,
          preferred_time: form.preferred_time,
          method: form.method,
          contact_phone: form.contact_phone,
          status: "예약 대기",
          meet_link: data.meet_link || null,
        });
        setShowForm(false);
        onBooked?.();
      }
    } catch {
      // ignore
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get min date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8"
    >
      <div className="flex items-start gap-4 mb-4">
        <span className="text-white/10 text-3xl font-bold font-mono leading-none">03</span>
        <div>
          <h3 className="text-lg font-bold">1차 미팅</h3>
          <p className="text-white/50 text-sm mt-1">
            제안서 내용을 바탕으로 상세한 논의를 진행합니다.
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isBooked && bookedData ? (
          <motion.div
            key="booked"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="ml-0 sm:ml-12 mt-4"
          >
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-green-400 font-medium">{bookedData.status}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-white/40 text-xs">날짜</span>
                  <p className="text-white/80">{bookedData.preferred_date}</p>
                </div>
                <div>
                  <span className="text-white/40 text-xs">시간</span>
                  <p className="text-white/80">{bookedData.preferred_time}</p>
                </div>
                <div>
                  <span className="text-white/40 text-xs">방법</span>
                  <p className="text-white/80">{bookedData.method}</p>
                </div>
                <div>
                  <span className="text-white/40 text-xs">연락처</span>
                  <p className="text-white/80">{bookedData.contact_phone}</p>
                </div>
              </div>
              {bookedData.meet_link && (
                <a
                  href={bookedData.meet_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-fit mt-2 px-5 py-2.5 bg-white text-black rounded-full text-sm font-medium hover:bg-white/90 active:scale-95 transition-all flex items-center gap-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Google Meet 참여하기
                </a>
              )}
            </div>
          </motion.div>
        ) : showForm ? (
          <motion.form
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            onSubmit={handleSubmit}
            className="ml-0 sm:ml-12 mt-4 flex flex-col gap-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-white/60">
                  희망 날짜 <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  required
                  min={minDate}
                  value={form.preferred_date}
                  onChange={(e) => setForm((p) => ({ ...p, preferred_date: e.target.value }))}
                  className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-white/30 text-white text-sm"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-white/60">
                  희망 시간 <span className="text-red-400">*</span>
                </label>
                <select
                  required
                  value={form.preferred_time}
                  onChange={(e) => setForm((p) => ({ ...p, preferred_time: e.target.value }))}
                  className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-white/30 text-white text-sm"
                >
                  <option value="" disabled>시간 선택</option>
                  {TIME_SLOTS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-white/60">
                미팅 방법 <span className="text-red-400">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {METHODS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, method: m }))}
                    className={`px-4 py-2 rounded-full text-sm border transition-all ${
                      form.method === m
                        ? "bg-white text-black border-white"
                        : "bg-white/5 text-white/70 border-white/10 hover:border-white/30"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-white/60">
                연락처 <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                required
                placeholder="010-1234-5678"
                value={form.contact_phone}
                onChange={(e) => setForm((p) => ({ ...p, contact_phone: e.target.value }))}
                className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-white/30 text-white text-sm placeholder:text-white/20 w-full sm:w-1/2"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-white/60">추가 메모</label>
              <textarea
                placeholder="미팅 전 전달하고 싶은 내용이 있으시면 적어주세요."
                value={form.memo}
                onChange={(e) => setForm((p) => ({ ...p, memo: e.target.value }))}
                rows={2}
                className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-white/30 text-white text-sm placeholder:text-white/20 resize-none"
              />
            </div>

            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 py-2 text-sm text-white/50 hover:text-white/70 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !form.preferred_date || !form.preferred_time || !form.method || !form.contact_phone}
                className="px-6 py-2 bg-white text-black rounded-full text-sm font-medium hover:bg-white/90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "예약 중..." : "미팅 예약하기"}
              </button>
            </div>
          </motion.form>
        ) : (
          <motion.div key="cta" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="ml-0 sm:ml-12 mt-4">
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-2.5 bg-white text-black rounded-full text-sm font-medium hover:bg-white/90 active:scale-95 transition-all"
            >
              1차 미팅 예약하기
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
