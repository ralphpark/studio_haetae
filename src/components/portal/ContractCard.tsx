"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SignatureCanvas from "react-signature-canvas";

interface Contract {
  id: string;
  status: string; // preparing, ready, signed
  contract_html?: string | null;
  admin_signature_url?: string | null;
  client_signature_url?: string | null;
  client_name?: string | null;
  signed_at?: string | null;
}

export function ContractCard({
  projectId,
  existingContract,
  onSigned,
}: {
  projectId: string;
  existingContract?: Contract | null;
  onSigned?: () => void;
}) {
  const [contract, setContract] = useState<Contract | null>(existingContract || null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [showContract, setShowContract] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [consent, setConsent] = useState(false);
  const [signerName, setSignerName] = useState("");
  const [signError, setSignError] = useState("");
  const sigCanvasRef = useRef<SignatureCanvas | null>(null);

  // Poll for contract status when preparing
  const pollContract = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/contract/check`);
      const data = await res.json();
      if (data.ready && data.contract) {
        setContract(data.contract);
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  }, [projectId]);

  useEffect(() => {
    if (!contract || contract.status !== "preparing") return;
    const interval = setInterval(async () => {
      const done = await pollContract();
      if (done) clearInterval(interval);
    }, 5000);
    return () => clearInterval(interval);
  }, [contract, pollContract]);

  const handleRequestContract = async () => {
    setIsRequesting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/contract`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.contract) {
        setContract(data.contract);
      }
    } catch {
      // ignore
    } finally {
      setIsRequesting(false);
    }
  };

  const handleSign = async () => {
    if (!sigCanvasRef.current || sigCanvasRef.current.isEmpty()) {
      setSignError("서명을 입력해주세요.");
      return;
    }
    if (!consent) {
      setSignError("전자서명 동의에 체크해주세요.");
      return;
    }
    if (!signerName.trim()) {
      setSignError("서명자 이름을 입력해주세요.");
      return;
    }

    setSignError("");
    setIsSigning(true);

    try {
      const signatureData = sigCanvasRef.current
        .getTrimmedCanvas()
        .toDataURL("image/png");

      const res = await fetch(`/api/projects/${projectId}/contract/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signature_data: signatureData,
          consent_given: true,
          signer_name: signerName.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setContract((prev) =>
          prev
            ? {
                ...prev,
                status: "signed",
                signed_at: data.signed_at,
                client_signature_url: data.client_signature_url,
                client_name: signerName.trim(),
              }
            : prev
        );
        onSigned?.();
      } else {
        const err = await res.json();
        setSignError(err.error || "서명 처리 중 오류가 발생했습니다.");
      }
    } catch {
      setSignError("서명 처리 중 오류가 발생했습니다.");
    } finally {
      setIsSigning(false);
    }
  };

  const clearSignature = () => {
    sigCanvasRef.current?.clear();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8"
    >
      <div className="flex items-start gap-4 mb-4">
        <span className="text-white/10 text-3xl font-bold font-mono leading-none">04</span>
        <div>
          <h3 className="text-lg font-bold">계약</h3>
          <p className="text-white/50 text-sm mt-1">
            {contract?.status === "signed"
              ? "계약이 체결되었습니다."
              : contract?.status === "ready"
              ? "계약서가 준비되었습니다. 내용을 확인하고 서명해주세요."
              : contract?.status === "preparing"
              ? "계약서를 작성하고 있습니다. 잠시만 기다려주세요."
              : "1차 미팅 후 계약서를 요청할 수 있습니다."}
          </p>
        </div>
      </div>

      <div className="ml-0 sm:ml-12 mt-4">
        <AnimatePresence mode="wait">
          {/* 계약 요청 전 */}
          {!contract && (
            <motion.div key="request" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <button
                onClick={handleRequestContract}
                disabled={isRequesting}
                className="px-6 py-2.5 bg-white text-black rounded-full text-sm font-medium hover:bg-white/90 active:scale-95 transition-all disabled:opacity-50"
              >
                {isRequesting ? "요청 중..." : "계약 진행하기"}
              </button>
            </motion.div>
          )}

          {/* 계약서 작성 중 */}
          {contract?.status === "preparing" && (
            <motion.div
              key="preparing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white/5 border border-white/10 rounded-xl p-5"
            >
              <div className="flex items-center justify-between">
                <span className="text-white/50 text-sm">계약서</span>
                <span className="text-white/20 text-sm">작성 중...</span>
              </div>
              <div className="mt-3 w-full bg-white/5 rounded-full h-1 overflow-hidden">
                <motion.div
                  className="h-full bg-white/20 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: "60%" }}
                  transition={{ duration: 3, ease: "easeInOut" }}
                />
              </div>
            </motion.div>
          )}

          {/* 계약서 준비 완료 - 서명 가능 */}
          {contract?.status === "ready" && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-4"
            >
              {/* 계약서 내용 보기 */}
              <button
                onClick={() => setShowContract(!showContract)}
                className="w-fit px-5 py-2.5 bg-white text-black rounded-full text-sm font-medium hover:bg-white/90 active:scale-95 transition-all"
              >
                {showContract ? "계약서 닫기" : "계약서 확인하기"}
              </button>

              <AnimatePresence>
                {showContract && contract.contract_html && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6 sm:p-8">
                      {/* 계약서 HTML 렌더링 */}
                      <div
                        className="prose prose-invert prose-sm max-w-none
                          [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:text-center
                          [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-3
                          [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2
                          [&_p]:text-white/70 [&_p]:leading-relaxed [&_p]:mb-2
                          [&_table]:w-full [&_table]:border-collapse [&_table]:my-4
                          [&_th]:text-left [&_th]:py-2 [&_th]:px-3 [&_th]:bg-white/5 [&_th]:border [&_th]:border-white/10 [&_th]:text-sm [&_th]:font-medium
                          [&_td]:py-2 [&_td]:px-3 [&_td]:border [&_td]:border-white/10 [&_td]:text-sm [&_td]:text-white/60
                          [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1
                          [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1
                          [&_li]:text-white/60 [&_li]:text-sm
                          [&_strong]:text-white/90"
                        dangerouslySetInnerHTML={{ __html: contract.contract_html }}
                      />

                      {/* 대표 서명 영역 */}
                      {contract.admin_signature_url && (
                        <div className="mt-8 pt-6 border-t border-white/10">
                          <div className="flex items-end justify-between">
                            <div>
                              <p className="text-white/40 text-xs mb-1">갑 (수급자)</p>
                              <p className="text-sm text-white/70 font-medium">Studio HaeTae 대표</p>
                            </div>
                            <div className="flex flex-col items-center">
                              <img
                                src={contract.admin_signature_url}
                                alt="대표 서명"
                                className="h-16 object-contain"
                              />
                              <span className="text-white/30 text-xs mt-1">서명 완료</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 고객 서명 영역 */}
                      <div className="mt-6 pt-6 border-t border-white/10">
                        <div className="flex flex-col gap-4">
                          <div>
                            <p className="text-white/40 text-xs mb-1">을 (발주자)</p>
                            <p className="text-sm text-white/70 font-medium">고객 서명</p>
                          </div>

                          {/* 서명자 이름 */}
                          <div className="flex flex-col gap-1.5">
                            <label className="text-sm text-white/50">서명자 이름 (본인 실명)</label>
                            <input
                              type="text"
                              value={signerName}
                              onChange={(e) => setSignerName(e.target.value)}
                              placeholder="홍길동"
                              className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-white/30 text-white text-sm placeholder:text-white/20 w-full sm:w-1/2"
                            />
                          </div>

                          {/* 서명 패드 */}
                          <div className="flex flex-col gap-2">
                            <label className="text-sm text-white/50">아래 영역에 서명해주세요</label>
                            <div className="relative bg-white rounded-xl overflow-hidden" style={{ touchAction: "none" }}>
                              <SignatureCanvas
                                ref={sigCanvasRef}
                                penColor="black"
                                canvasProps={{
                                  className: "w-full",
                                  style: { width: "100%", height: 160 },
                                }}
                                backgroundColor="white"
                              />
                              <button
                                type="button"
                                onClick={clearSignature}
                                className="absolute top-2 right-2 px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs hover:bg-gray-200 transition-colors"
                              >
                                지우기
                              </button>
                            </div>
                          </div>

                          {/* 동의 체크박스 */}
                          <label className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={consent}
                              onChange={(e) => setConsent(e.target.checked)}
                              className="mt-0.5 w-4 h-4 rounded border-white/20 bg-white/5 accent-white"
                            />
                            <span className="text-sm text-white/60 leading-relaxed">
                              본 계약서의 내용을 모두 확인하였으며, 전자서명법에 따라 위
                              전자서명이 자필서명과 동일한 법적 효력을 가짐에 동의합니다.
                            </span>
                          </label>

                          {signError && (
                            <p className="text-red-400 text-sm">{signError}</p>
                          )}

                          <button
                            onClick={handleSign}
                            disabled={isSigning}
                            className="w-fit px-6 py-2.5 bg-white text-black rounded-full text-sm font-medium hover:bg-white/90 active:scale-95 transition-all disabled:opacity-50"
                          >
                            {isSigning ? "서명 처리 중..." : "서명하고 계약 체결하기"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* 계약 완료 */}
          {contract?.status === "signed" && (
            <motion.div
              key="signed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col gap-4"
            >
              <div className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-green-400 font-medium">계약 체결 완료</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-white/40 text-xs">계약 체결일</span>
                  <p className="text-white/80">
                    {contract.signed_at
                      ? new Date(contract.signed_at).toLocaleDateString("ko-KR")
                      : "-"}
                  </p>
                </div>
                <div>
                  <span className="text-white/40 text-xs">상태</span>
                  <p className="text-white/80">계약 완료</p>
                </div>
              </div>

              {/* 서명 미리보기 */}
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/10">
                <div>
                  <p className="text-white/40 text-xs mb-1">갑 (수급자)</p>
                  <p className="text-sm text-white/80 font-medium mb-2">Studio HaeTae 대표 박근수</p>
                  {contract.admin_signature_url && (
                    <div className="bg-white rounded-lg p-2 inline-block">
                      <img
                        src={contract.admin_signature_url}
                        alt="대표 서명"
                        className="h-12 object-contain"
                      />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-white/40 text-xs mb-1">을 (발주자)</p>
                  <p className="text-sm text-white/80 font-medium mb-2">
                    {contract.client_name || "고객"}
                  </p>
                  {contract.client_signature_url && (
                    <div className="bg-white rounded-lg p-2 inline-block">
                      <img
                        src={contract.client_signature_url}
                        alt="고객 서명"
                        className="h-12 object-contain"
                      />
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => setShowContract(!showContract)}
                className="w-fit px-5 py-2 bg-white/10 border border-white/10 rounded-full text-sm hover:bg-white/20 active:scale-95 transition-all"
              >
                {showContract ? "계약서 닫기" : "계약서 다시 보기"}
              </button>

              <AnimatePresence>
                {showContract && contract.contract_html && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div
                      className="bg-white/[0.03] border border-white/10 rounded-xl p-6 prose prose-invert prose-sm max-w-none
                        [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:text-center
                        [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-3
                        [&_p]:text-white/70 [&_p]:leading-relaxed [&_p]:mb-2
                        [&_table]:w-full [&_table]:border-collapse [&_table]:my-4
                        [&_th]:text-left [&_th]:py-2 [&_th]:px-3 [&_th]:bg-white/5 [&_th]:border [&_th]:border-white/10 [&_th]:text-sm
                        [&_td]:py-2 [&_td]:px-3 [&_td]:border [&_td]:border-white/10 [&_td]:text-sm [&_td]:text-white/60
                        [&_strong]:text-white/90"
                      dangerouslySetInnerHTML={{ __html: contract.contract_html }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
