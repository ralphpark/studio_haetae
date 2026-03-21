"use client";

import { useState, useRef } from "react";
import SignatureCanvas from "react-signature-canvas";

export function AdminProjectActions({
  projectId,
  step,
  notionPageId,
  documentUrls,
  contractStatus: initialContractStatus,
}: {
  projectId: string;
  step: number;
  notionPageId: string | null;
  documentUrls: { proposal_url?: string; estimate_url?: string } | null;
  contractStatus?: string | null;
}) {
  const [currentStep, setCurrentStep] = useState(step);
  const [proposalUrl, setProposalUrl] = useState(documentUrls?.proposal_url || "");
  const [estimateUrl, setEstimateUrl] = useState(documentUrls?.estimate_url || "");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Contract management
  const [contractHtml, setContractHtml] = useState("");
  const [contractStatus, setContractStatus] = useState(initialContractStatus || "");
  const [isSavingContract, setIsSavingContract] = useState(false);
  const [contractSaved, setContractSaved] = useState(false);
  const adminSigRef = useRef<SignatureCanvas | null>(null);

  const handleCompleteDocs = async () => {
    if (!proposalUrl && !estimateUrl) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/projects/${projectId}/complete-docs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposal_url: proposalUrl || null,
          estimate_url: estimateUrl || null,
        }),
      });

      if (res.ok) {
        setCurrentStep(4);
        setSaved(true);
      }
    } catch {
      // ignore
    } finally {
      setIsSaving(false);
    }
  };

  const notionUrl = notionPageId
    ? `https://notion.so/${notionPageId.replace(/-/g, "")}`
    : null;

  return (
    <div className="flex flex-col gap-6">
      {/* Notion Link */}
      <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-bold mb-4">Notion</h2>
        {notionUrl ? (
          <a
            href={notionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-400 underline hover:text-blue-300 break-all"
          >
            {notionUrl}
          </a>
        ) : (
          <p className="text-white/40 text-sm">Notion 페이지가 아직 생성되지 않았습니다.</p>
        )}
      </section>

      {/* 작성완료 트리거 */}
      <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-bold mb-2">기획서 & 견적서 공유</h2>
        <p className="text-white/50 text-sm mb-4">
          Notion에서 기획서/견적서 작성 후 링크를 입력하고 &quot;작성완료&quot;를 누르면
          클라이언트 포털에 활성화됩니다.
        </p>

        {currentStep >= 4 && saved ? (
          <div className="flex items-center gap-2 text-green-400 text-sm">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            클라이언트에게 공유 완료
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/40">기획서 Notion URL</label>
              <input
                type="url"
                placeholder="https://notion.so/..."
                value={proposalUrl}
                onChange={(e) => setProposalUrl(e.target.value)}
                className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-white/30 text-white text-sm placeholder:text-white/20"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/40">견적서 Notion URL</label>
              <input
                type="url"
                placeholder="https://notion.so/..."
                value={estimateUrl}
                onChange={(e) => setEstimateUrl(e.target.value)}
                className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-white/30 text-white text-sm placeholder:text-white/20"
              />
            </div>
            <button
              onClick={handleCompleteDocs}
              disabled={isSaving || (!proposalUrl && !estimateUrl)}
              className="self-start px-6 py-2.5 bg-white text-black rounded-full text-sm font-medium hover:bg-white/90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed mt-2"
            >
              {isSaving ? "처리 중..." : "작성완료 — 클라이언트에게 공유"}
            </button>
          </div>
        )}
      </section>

      {/* 계약서 관리 */}
      <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-bold mb-2">계약서 관리</h2>
        {contractStatus === "signed" ? (
          <div className="flex items-center gap-2 text-green-400 text-sm">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            계약 체결 완료
          </div>
        ) : contractStatus === "ready" || contractSaved ? (
          <div className="flex items-center gap-2 text-blue-400 text-sm">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            계약서 확정 — 고객 서명 대기 중
          </div>
        ) : contractStatus === "preparing" ? (
          <div className="flex flex-col gap-4">
            <p className="text-white/50 text-sm">
              고객이 계약을 요청했습니다. 계약서 HTML을 입력하고 대표 서명 후 확정해주세요.
            </p>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/40">계약서 내용 (HTML)</label>
              <textarea
                value={contractHtml}
                onChange={(e) => setContractHtml(e.target.value)}
                rows={12}
                placeholder="<h1>소프트웨어 개발 용역 계약서</h1>..."
                className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-white/30 text-white text-sm font-mono placeholder:text-white/20 resize-y"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs text-white/40">대표 서명</label>
              <div className="relative bg-white rounded-xl overflow-hidden w-full max-w-md" style={{ touchAction: "none" }}>
                <SignatureCanvas
                  ref={adminSigRef}
                  penColor="black"
                  canvasProps={{
                    className: "w-full",
                    style: { width: "100%", height: 120 },
                  }}
                  backgroundColor="white"
                />
                <button
                  type="button"
                  onClick={() => adminSigRef.current?.clear()}
                  className="absolute top-2 right-2 px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs hover:bg-gray-200"
                >
                  지우기
                </button>
              </div>
            </div>

            <button
              onClick={async () => {
                if (!contractHtml.trim()) return;
                setIsSavingContract(true);
                try {
                  const adminSigData = adminSigRef.current && !adminSigRef.current.isEmpty()
                    ? adminSigRef.current.getTrimmedCanvas().toDataURL("image/png")
                    : null;

                  const res = await fetch(`/api/admin/projects/${projectId}/contract`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      contract_html: contractHtml,
                      admin_signature_data: adminSigData,
                    }),
                  });

                  if (res.ok) {
                    setContractSaved(true);
                    setContractStatus("ready");
                  }
                } catch {
                  // ignore
                } finally {
                  setIsSavingContract(false);
                }
              }}
              disabled={isSavingContract || !contractHtml.trim()}
              className="self-start px-6 py-2.5 bg-white text-black rounded-full text-sm font-medium hover:bg-white/90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSavingContract ? "처리 중..." : "계약서 확정 — 고객에게 서명 요청"}
            </button>
          </div>
        ) : (
          <p className="text-white/40 text-sm">아직 계약 요청이 없습니다.</p>
        )}
      </section>

      {/* Step 현황 */}
      <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-bold mb-4">진행 현황</h2>
        <div className="flex gap-2 flex-wrap">
          {[
            { s: 0, label: "상담" },
            { s: 1, label: "제안서" },
            { s: 2, label: "기획서" },
            { s: 3, label: "미팅" },
            { s: 4, label: "계약" },
            { s: 5, label: "계약요청" },
            { s: 6, label: "킥오프" },
          ].map(({ s, label }) => (
            <span
              key={s}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                s <= currentStep
                  ? "bg-white text-black border-white"
                  : "bg-white/5 text-white/30 border-white/10"
              }`}
            >
              {label}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
