"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface MeetingData {
  preferred_date: string;
  preferred_time: string;
  method: string;
  contact_phone: string;
  memo: string;
}

const TIME_SLOTS = [
  "10:00", "11:00", "12:00", "13:00",
  "14:00", "15:00", "16:00", "17:00",
];

const METHODS = ["화상 미팅 (Google Meet)", "전화 미팅", "메신저 미팅 (Discord)"];

export function MeetingCard({
  projectId,
  existingMeeting,
  onBooked,
  onContractClick,
}: {
  projectId: string;
  existingMeeting?: {
    preferred_date: string;
    preferred_time: string;
    method: string;
    contact_phone: string;
    status: string;
    meet_link?: string | null;
    discord_invite?: string | null;
  } | null;
  onBooked?: () => void;
  onContractClick?: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBooked, setIsBooked] = useState(!!existingMeeting);
  const [bookedData, setBookedData] = useState(existingMeeting);
  const [busySlots, setBusySlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [form, setForm] = useState<MeetingData>({
    preferred_date: "",
    preferred_time: "",
    method: "",
    contact_phone: "",
    memo: "",
  });

  // Fetch busy slots when date changes
  useEffect(() => {
    if (!form.preferred_date) {
      setBusySlots([]);
      return;
    }

    let cancelled = false;
    setLoadingSlots(true);
    setBusySlots([]);
    setForm((p) => ({ ...p, preferred_time: "" }));

    fetch(`/api/calendar/busy?date=${form.preferred_date}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setBusySlots(data.busySlots || []);
        }
      })
      .catch(() => {
        if (!cancelled) setBusySlots([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });

    return () => { cancelled = true; };
  }, [form.preferred_date]);

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
          discord_invite: data.discord_invite || null,
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
            상세 기획서와 견적서를 바탕으로 상세한 논의를 진행합니다.
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
              {bookedData.discord_invite && (
                <a
                  href={bookedData.discord_invite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-fit mt-2 px-5 py-2.5 bg-[#5865F2] text-white rounded-full text-sm font-medium hover:bg-[#4752C4] active:scale-95 transition-all flex items-center gap-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
                  </svg>
                  Discord 메신저 참여하기
                </a>
              )}
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-white/50 text-sm">
                  미팅이 완료되면 아래에서 계약을 진행할 수 있습니다.
                </p>
              </div>
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
                className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-white/30 text-white text-sm w-full sm:w-1/2"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-white/60">
                희망 시간 <span className="text-red-400">*</span>
              </label>
              {!form.preferred_date ? (
                <p className="text-white/30 text-sm">날짜를 먼저 선택해주세요.</p>
              ) : loadingSlots ? (
                <p className="text-white/30 text-sm">예약 가능 시간 확인 중...</p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {TIME_SLOTS.map((slot) => {
                    const isBusy = busySlots.includes(slot);
                    const isSelected = form.preferred_time === slot;
                    const [h] = slot.split(":");
                    const endH = String(Number(h) + 1).padStart(2, "0");

                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={isBusy}
                        onClick={() => setForm((p) => ({ ...p, preferred_time: slot }))}
                        className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${
                          isBusy
                            ? "bg-white/[0.02] text-white/20 border-white/5 cursor-not-allowed line-through"
                            : isSelected
                            ? "bg-white text-black border-white"
                            : "bg-white/5 text-white/70 border-white/10 hover:border-white/30 hover:bg-white/10"
                        }`}
                      >
                        <span className="block text-xs">{slot}~{endH}:00</span>
                      </button>
                    );
                  })}
                </div>
              )}
              {form.preferred_date && !loadingSlots && busySlots.length > 0 && (
                <p className="text-white/30 text-xs mt-1">
                  취소선이 있는 시간은 다른 일정이 있어 선택할 수 없습니다.
                </p>
              )}
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
