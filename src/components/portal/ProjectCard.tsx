"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Project {
  id: string;
  project_number: number;
  project_name: string | null;
  company: string;
  project_type: string;
  project_purpose: string;
  target_user: string;
  features: string[];
  design_status: string;
  budget: string;
  timeline: string;
  maintenance: string;
  reference_url: string | null;
  message: string | null;
  status: string;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  "상담 접수": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "기획 진행": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  "개발 진행": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "완료": "bg-green-500/20 text-green-400 border-green-500/30",
};

export function ProjectCard({ project }: { project: Project }) {
  const router = useRouter();
  const defaultName = `프로젝트 ${project.project_number}`;
  const [name, setName] = useState(project.project_name || defaultName);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      }
    } catch {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const saveName = async (newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === name) {
      setName(name);
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_name: trimmed }),
      });
      if (res.ok) {
        setName(trimmed);
      }
    } catch {
      // revert on error
    }
    setIsSaving(false);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") saveName(e.currentTarget.value);
    if (e.key === "Escape") setIsEditing(false);
  };

  const date = new Date(project.created_at).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const statusColor =
    STATUS_COLORS[project.status] || "bg-white/10 text-white/60 border-white/20";

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-md hover:border-white/20 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            {isEditing ? (
              <input
                ref={inputRef}
                defaultValue={name}
                onBlur={(e) => saveName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="text-xl font-bold bg-white/5 border border-white/20 rounded-lg px-2 py-0.5 outline-none focus:border-white/40 w-56"
                maxLength={30}
              />
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="text-xl font-bold hover:underline decoration-white/30 underline-offset-4 cursor-pointer text-left"
                title="클릭하여 프로젝트명 변경"
              >
                {isSaving ? "저장 중..." : name}
              </button>
            )}
            <span
              className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${statusColor}`}
            >
              {project.status}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-white/40 text-sm">{date}</p>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-white/25 text-xs hover:text-white/50 transition-colors"
              >
                이름 변경
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-white/20 text-sm font-mono">
            #{String(project.project_number).padStart(3, "0")}
          </span>
          {showDeleteConfirm ? (
            <div className="flex items-center gap-2">
              <span className="text-white/40 text-xs">삭제하시겠습니까?</span>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-red-400 text-xs hover:text-red-300 font-medium disabled:opacity-50"
              >
                {isDeleting ? "삭제 중..." : "삭제"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-white/40 text-xs hover:text-white/60"
              >
                취소
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-white/15 hover:text-red-400/60 transition-colors"
              title="프로젝트 삭제"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <InfoItem label="프로젝트 유형" value={project.project_type} />
        <InfoItem label="프로젝트 목적" value={project.project_purpose} />
        <InfoItem label="타겟 사용자" value={project.target_user} />
        <InfoItem label="예산" value={project.budget} />
        <InfoItem label="일정" value={project.timeline} />
        <InfoItem label="유지보수" value={project.maintenance} />
      </div>

      {/* Features */}
      <div className="mb-4">
        <p className="text-xs font-medium text-white/40 mb-2">핵심 기능</p>
        <div className="flex flex-wrap gap-1.5">
          {project.features.map((feat) => (
            <span
              key={feat}
              className="px-2.5 py-1 text-xs bg-white/5 border border-white/10 rounded-full text-white/70"
            >
              {feat}
            </span>
          ))}
        </div>
      </div>

      {/* Design Status */}
      <div className="mb-4">
        <p className="text-xs font-medium text-white/40 mb-1">디자인</p>
        <p className="text-sm text-white/70">{project.design_status}</p>
      </div>

      {/* Optional fields */}
      {project.reference_url && (
        <div className="mb-4">
          <p className="text-xs font-medium text-white/40 mb-1">레퍼런스</p>
          <a
            href={project.reference_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-white/70 underline hover:text-white transition-colors break-all"
          >
            {project.reference_url}
          </a>
        </div>
      )}

      {project.message && (
        <div className="mb-6">
          <p className="text-xs font-medium text-white/40 mb-1">추가 요청사항</p>
          <p className="text-sm text-white/60 whitespace-pre-wrap">
            {project.message}
          </p>
        </div>
      )}

      {/* Footer: 프로젝트 들어가기 */}
      <div className="flex justify-end pt-4 border-t border-white/5">
        <a
          href={`/portal/${project.id}`}
          className="px-5 py-2 bg-white/10 border border-white/10 rounded-full text-sm font-medium hover:bg-white/20 hover:border-white/20 active:scale-95 transition-all"
        >
          프로젝트 들어가기 →
        </a>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-white/40">{label}</span>
      <span className="text-sm text-white/80">{value}</span>
    </div>
  );
}
