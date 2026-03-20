"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ProposalModal } from "./ProposalModal";
import { MeetingCard } from "./MeetingCard";

interface ProposalSection {
  id: string;
  title: string;
  content: string;
}

interface Proposal {
  title: string;
  sections: ProposalSection[];
}

interface ConsultationSummary {
  company: string;
  projectType: string;
  projectPurpose: string;
  targetUser: string;
  features: string[];
  designStatus: string;
  budget: string;
  timeline: string;
  maintenance: string;
}

interface Meeting {
  preferred_date: string;
  preferred_time: string;
  method: string;
  contact_phone: string;
  status: string;
}

function ConsultationCard({ data }: { data: ConsultationSummary }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
      <div className="flex items-start gap-4 mb-4">
        <span className="text-white/10 text-3xl font-bold font-mono leading-none">00</span>
        <h3 className="text-lg font-bold">상담 요약</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm ml-0 sm:ml-12">
        <Item label="프로젝트 유형" value={data.projectType} />
        <Item label="프로젝트 목적" value={data.projectPurpose} />
        <Item label="타겟 사용자" value={data.targetUser} />
        <Item label="예산" value={data.budget} />
        <Item label="일정" value={data.timeline} />
        <Item label="유지보수" value={data.maintenance} />
        <Item label="디자인" value={data.designStatus} />
        <div className="sm:col-span-2">
          <span className="text-white/40 text-xs">핵심 기능</span>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {data.features.map((f) => (
              <span
                key={f}
                className="px-2 py-0.5 text-xs bg-white/5 border border-white/10 rounded-full text-white/60"
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-white/40 text-xs">{label}</span>
      <p className="text-white/80">{value}</p>
    </div>
  );
}

function DocumentCard({
  documentUrls,
}: {
  documentUrls: { proposal_url?: string; estimate_url?: string } | null;
}) {
  const hasDocuments = documentUrls?.proposal_url || documentUrls?.estimate_url;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8"
    >
      <div className="flex items-start gap-4 mb-4">
        <span className="text-white/10 text-3xl font-bold font-mono leading-none">03</span>
        <div>
          <h3 className="text-lg font-bold">기획서 & 견적서</h3>
          <p className="text-white/50 text-sm mt-1">
            {hasDocuments
              ? "상세 기획서와 견적서가 준비되었습니다."
              : "미팅 완료 후 상세 기획서와 견적서를 공유해드리겠습니다."}
          </p>
        </div>
      </div>
      {hasDocuments ? (
        <div className="ml-0 sm:ml-12 mt-4 flex flex-wrap gap-3">
          {documentUrls?.proposal_url && (
            <a
              href={documentUrls.proposal_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 bg-white text-black rounded-full text-sm font-medium hover:bg-white/90 active:scale-95 transition-all"
            >
              기획서 확인하기
            </a>
          )}
          {documentUrls?.estimate_url && (
            <a
              href={documentUrls.estimate_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 bg-white/10 border border-white/10 rounded-full text-sm font-medium hover:bg-white/20 active:scale-95 transition-all"
            >
              견적서 확인하기
            </a>
          )}
        </div>
      ) : (
        <div className="ml-0 sm:ml-12 mt-4">
          <div className="px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-white/30 text-sm">
            준비 중입니다
          </div>
        </div>
      )}
    </motion.div>
  );
}

function KickoffCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8"
    >
      <div className="flex items-start gap-4 mb-4">
        <span className="text-white/10 text-3xl font-bold font-mono leading-none">04</span>
        <div>
          <h3 className="text-lg font-bold">프로젝트 진행을 원하시나요?</h3>
          <p className="text-white/50 text-sm mt-1">
            전용 Slack 채널이 생성되고 프로젝트가 시작됩니다.
          </p>
        </div>
      </div>
      <div className="ml-0 sm:ml-12 mt-4">
        <button className="px-6 py-2.5 bg-white text-black rounded-full text-sm font-medium hover:bg-white/90 active:scale-95 transition-all">
          프로젝트 시작하기
        </button>
      </div>
    </motion.div>
  );
}

export function ProposalView({
  projectId,
  initialProposal,
  consultationSummary,
  step,
  meeting,
  documentUrls,
}: {
  projectId: string;
  initialProposal: Proposal | null;
  consultationSummary: ConsultationSummary;
  step: number;
  meeting?: Meeting | null;
  documentUrls?: { proposal_url?: string; estimate_url?: string } | null;
}) {
  const [proposal, setProposal] = useState<Proposal | null>(initialProposal);
  const [currentStep, setCurrentStep] = useState(step);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");

  const handleProposalClick = async () => {
    // Already generated — just open modal
    if (proposal) {
      setShowModal(true);
      return;
    }

    // Generate
    setIsGenerating(true);
    setError("");

    try {
      const res = await fetch(`/api/projects/${projectId}/proposal`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "생성 실패");
      }

      const { proposal: newProposal } = await res.json();
      setProposal(newProposal);
      if (currentStep < 1) setCurrentStep(1);
      setShowModal(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "잠시 후 다시 확인해주세요."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMeetingBooked = () => {
    if (currentStep < 2) setCurrentStep(2);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Step 0: 상담 요약 */}
      <ConsultationCard data={consultationSummary} />

      {/* Step 1: 제안서 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8"
      >
        <div className="flex items-start gap-4 mb-4">
          <span className="text-white/10 text-3xl font-bold font-mono leading-none">01</span>
          <div>
            <h3 className="text-lg font-bold">제안서</h3>
            <p className="text-white/50 text-sm mt-1">
              상담 내용을 기반으로 Studio HaeTae의 제안서를 확인해보세요.
            </p>
          </div>
        </div>
        <div className="ml-0 sm:ml-12 mt-4 flex flex-col gap-3">
          {error && (
            <p className="text-white/50 text-sm">{error}</p>
          )}
          <div>
            <button
              onClick={handleProposalClick}
              disabled={isGenerating}
              className={`px-6 py-2.5 rounded-full text-sm font-medium active:scale-95 transition-all disabled:opacity-50 ${
                proposal
                  ? "bg-white text-black hover:bg-white/90"
                  : "bg-white/10 border border-white/10 text-white hover:bg-white/20"
              }`}
            >
              {isGenerating ? "확인 중..." : "제안서 확인하기"}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Step 2: 미팅 (제안서 생성 후 표시) */}
      {currentStep >= 1 && (
        <MeetingCard
          projectId={projectId}
          existingMeeting={meeting}
          onBooked={handleMeetingBooked}
        />
      )}

      {/* Step 3: 기획서/견적서 (미팅 예약 후 표시) */}
      {currentStep >= 2 && (
        <DocumentCard documentUrls={documentUrls || null} />
      )}

      {/* Step 4: 킥오프 (기획서/견적서 활성화 후 표시) */}
      {currentStep >= 4 && <KickoffCard />}

      {/* Proposal Modal */}
      <AnimatePresence>
        {showModal && proposal && (
          <ProposalModal proposal={proposal} onClose={() => setShowModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
