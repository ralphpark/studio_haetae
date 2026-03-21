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

interface PlanningDoc {
  title: string;
  sections: { title: string; content: string }[];
}

interface Estimate {
  title: string;
  items: { name: string; price: string; note: string }[];
  total: string;
}

function DocumentCard({
  documentUrls,
  planningDoc,
  estimate,
  isConfirmed,
  isInProgress,
}: {
  documentUrls: { proposal_url?: string; estimate_url?: string } | null;
  planningDoc?: PlanningDoc | null;
  estimate?: Estimate | null;
  isConfirmed?: boolean;
  isInProgress?: boolean;
}) {
  const [showPlanningDoc, setShowPlanningDoc] = useState(false);
  const [showEstimate, setShowEstimate] = useState(false);
  const hasDocuments = documentUrls?.proposal_url || documentUrls?.estimate_url;
  const hasGeneratedDocs = planningDoc || estimate;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8"
    >
      <div className="flex items-start gap-4 mb-4">
        <span className="text-white/10 text-3xl font-bold font-mono leading-none">02</span>
        <div>
          <h3 className="text-lg font-bold">기획서 & 견적서</h3>
          <p className="text-white/50 text-sm mt-1">
            {isConfirmed
              ? "상세 기획서와 견적서가 확정되었습니다."
              : isInProgress && !hasGeneratedDocs
              ? "AI가 기획서와 견적서를 생성하고 있습니다..."
              : isInProgress && hasGeneratedDocs
              ? "AI가 기획서를 작성했습니다. 검토 후 확정되면 미팅 예약이 가능합니다."
              : hasGeneratedDocs || hasDocuments
              ? "상세 기획서와 견적서가 준비되었습니다."
              : "제안서 확인 후 AI가 자동으로 기획서와 견적서를 생성합니다."}
          </p>
        </div>
      </div>

      <div className="ml-0 sm:ml-12 mt-4 flex flex-col gap-4">
        {/* Generated docs buttons */}
        {hasGeneratedDocs && (
          <div className="flex flex-wrap gap-3">
            {planningDoc && (
              <button
                onClick={() => setShowPlanningDoc(!showPlanningDoc)}
                className="px-5 py-2.5 bg-white text-black rounded-full text-sm font-medium hover:bg-white/90 active:scale-95 transition-all"
              >
                {showPlanningDoc ? "기획서 닫기" : "기획서 확인하기"}
              </button>
            )}
            {estimate && (
              <button
                onClick={() => setShowEstimate(!showEstimate)}
                className="px-5 py-2.5 bg-white/10 border border-white/10 rounded-full text-sm font-medium hover:bg-white/20 active:scale-95 transition-all"
              >
                {showEstimate ? "견적서 닫기" : "견적서 확인하기"}
              </button>
            )}
          </div>
        )}

        {/* External doc links */}
        {hasDocuments && (
          <div className="flex flex-wrap gap-3">
            {documentUrls?.proposal_url && (
              <a
                href={documentUrls.proposal_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 bg-white/10 border border-white/10 rounded-full text-sm font-medium hover:bg-white/20 active:scale-95 transition-all"
              >
                기획서 문서 링크
              </a>
            )}
            {documentUrls?.estimate_url && (
              <a
                href={documentUrls.estimate_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 bg-white/10 border border-white/10 rounded-full text-sm font-medium hover:bg-white/20 active:scale-95 transition-all"
              >
                견적서 문서 링크
              </a>
            )}
          </div>
        )}

        {/* No docs yet */}
        {!hasGeneratedDocs && !hasDocuments && (
          <div className="px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-white/30 text-sm">
            준비 중입니다
          </div>
        )}

        {/* Inline Planning Doc */}
        <AnimatePresence>
          {showPlanningDoc && planningDoc && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col gap-4">
                <h4 className="text-lg font-bold">{planningDoc.title}</h4>
                {planningDoc.sections.map((section, i) => (
                  <div key={i}>
                    <h5 className="text-sm font-semibold text-white/70 mb-1">{section.title}</h5>
                    <p className="text-sm text-white/50 whitespace-pre-wrap leading-relaxed">
                      {section.content}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Inline Estimate */}
        <AnimatePresence>
          {showEstimate && estimate && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h4 className="text-lg font-bold mb-4">{estimate.title}</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-2 text-white/40 font-medium">항목</th>
                        <th className="text-right py-2 text-white/40 font-medium">비용</th>
                        <th className="text-left py-2 pl-4 text-white/40 font-medium">비고</th>
                      </tr>
                    </thead>
                    <tbody>
                      {estimate.items.map((item, i) => (
                        <tr key={i} className="border-b border-white/5">
                          <td className="py-2 text-white/70">{item.name}</td>
                          <td className="py-2 text-right text-white/80 font-mono">{item.price}</td>
                          <td className="py-2 pl-4 text-white/40">{item.note}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-white/20">
                        <td className="py-3 font-bold">합계</td>
                        <td className="py-3 text-right font-bold font-mono text-white">
                          {estimate.total}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
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
        {/* MeetingCard is 03, KickoffCard is 04 */}
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
  planningDoc,
  estimate,
  docsRequested: initialDocsRequested,
  docsConfirmed: initialDocsConfirmed,
  notionPublicUrl: initialNotionUrl,
}: {
  projectId: string;
  initialProposal: Proposal | null;
  consultationSummary: ConsultationSummary;
  step: number;
  meeting?: Meeting | null;
  documentUrls?: { proposal_url?: string; estimate_url?: string } | null;
  planningDoc?: PlanningDoc | null;
  estimate?: Estimate | null;
  docsRequested?: boolean;
  docsConfirmed?: boolean;
  notionPublicUrl?: string | null;
}) {
  const [proposal, setProposal] = useState<Proposal | null>(initialProposal);
  const [currentStep, setCurrentStep] = useState(step);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const [docsRequested, setDocsRequested] = useState(initialDocsRequested ?? false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [docsConfirmed, setDocsConfirmed] = useState(initialDocsConfirmed ?? false);
  const [notionUrl, setNotionUrl] = useState(initialNotionUrl || "");
  const [isChecking, setIsChecking] = useState(false);

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

      // 제안서 모달 표시 후, 기획서/견적서 백그라운드 생성 (별도 API)
      fetch(`/api/projects/${projectId}/generate-docs`, { method: "POST" })
        .catch((err) => console.error("Generate docs error:", err));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "잠시 후 다시 확인해주세요."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRequestDocs = async () => {
    setIsRequesting(true);
    try {
      // 1. DB에 요청 상태 저장
      const reqRes = await fetch(`/api/projects/${projectId}/request-docs`, { method: "POST" });
      if (!reqRes.ok) throw new Error("요청 실패");
      setDocsRequested(true);

      // 2. 기획서/견적서 생성 (백그라운드)
      fetch(`/api/projects/${projectId}/generate-docs`, { method: "POST" })
        .catch((err) => console.error("Generate docs error:", err));
    } catch (err) {
      console.error(err);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleCheckNotion = async () => {
    setIsChecking(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/check-notion`);
      const data = await res.json();
      if (data.confirmed) {
        setDocsConfirmed(true);
        setNotionUrl(data.notionUrl || "");
        setCurrentStep(3);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsChecking(false);
    }
  };

  const handleMeetingBooked = () => {
    if (currentStep < 4) setCurrentStep(4);
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

      {/* Step 2: 기획서/견적서 요청 카드 (제안서 생성 후 표시) */}
      {proposal && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8"
        >
          <div className="flex items-start gap-4 mb-4">
            <span className="text-white/10 text-3xl font-bold font-mono leading-none">02</span>
            <div>
              <h3 className="text-lg font-bold">기획서 & 견적서</h3>
              <p className="text-white/50 text-sm mt-1">
                {docsConfirmed
                  ? "기획서와 견적서가 확정되었습니다. 아래 링크에서 확인하세요."
                  : docsRequested && (planningDoc || estimate)
                  ? "AI가 기획서와 견적서를 작성했습니다. Notion에서 수정 후 '수정완료'를 체크해주세요."
                  : docsRequested
                  ? "AI가 기획서와 견적서를 생성하고 있습니다..."
                  : "상세 기획서와 견적서를 받아보시겠습니까?"}
              </p>
            </div>
          </div>

          <div className="ml-0 sm:ml-12 mt-4 flex flex-col gap-4">
            {/* 아직 요청 안 한 상태 */}
            {!docsRequested && (
              <button
                onClick={handleRequestDocs}
                disabled={isRequesting}
                className="w-fit px-6 py-2.5 bg-white text-black rounded-full text-sm font-medium hover:bg-white/90 active:scale-95 transition-all disabled:opacity-50"
              >
                {isRequesting ? "요청 중..." : "네, 받아볼게요"}
              </button>
            )}

            {/* 요청했고 생성됨 - 인라인 미리보기 + Notion 확인 버튼 */}
            {docsRequested && (planningDoc || estimate) && !docsConfirmed && (
              <>
                <DocumentCard
                  documentUrls={documentUrls || null}
                  planningDoc={planningDoc}
                  estimate={estimate}
                  isInProgress={true}
                />
                <button
                  onClick={handleCheckNotion}
                  disabled={isChecking}
                  className="w-fit px-6 py-2.5 bg-white/10 border border-white/10 rounded-full text-sm font-medium hover:bg-white/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isChecking ? "확인 중..." : "Notion 수정완료 확인하기"}
                </button>
              </>
            )}

            {/* 요청했지만 아직 생성 안 됨 */}
            {docsRequested && !planningDoc && !estimate && !docsConfirmed && (
              <div className="px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-white/30 text-sm">
                AI가 문서를 생성하고 있습니다. 잠시 후 새로고침 해주세요.
              </div>
            )}

            {/* 확정 완료 - Notion 링크 표시 */}
            {docsConfirmed && (
              <div className="flex flex-col gap-3">
                <DocumentCard
                  documentUrls={documentUrls || null}
                  planningDoc={planningDoc}
                  estimate={estimate}
                  isConfirmed={true}
                />
                {notionUrl && (
                  <a
                    href={notionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-fit px-5 py-2.5 bg-white text-black rounded-full text-sm font-medium hover:bg-white/90 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M4 4.5A2.5 2.5 0 016.5 2H14l6 6v11.5a2.5 2.5 0 01-2.5 2.5h-11A2.5 2.5 0 014 19.5v-15zM14 2.5V8h5.5L14 2.5z" />
                    </svg>
                    Notion에서 확정 문서 보기
                  </a>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Step 3+: 미팅 (기획서/견적서 확정 후 표시) */}
      {docsConfirmed && (
        <MeetingCard
          projectId={projectId}
          existingMeeting={meeting}
          onBooked={handleMeetingBooked}
        />
      )}

      {/* Step 5: 킥오프 (미팅 예약 후 표시) */}
      {currentStep >= 5 && <KickoffCard />}

      {/* Proposal Modal */}
      <AnimatePresence>
        {showModal && proposal && (
          <ProposalModal proposal={proposal} onClose={() => setShowModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
