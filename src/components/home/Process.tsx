"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Navbar } from "@/components/layout/Navbar";

const steps = [
  {
    num: "01",
    title: "Discovery",
    subtitle: "상담 & 분석",
    description:
      "비즈니스 목표, 타깃 유저, 기술 요구사항을 깊이 있게 파악합니다. AI 상담 폼과 1:1 미팅을 통해 프로젝트의 핵심 방향을 함께 정의합니다.",
  },
  {
    num: "02",
    title: "Blueprint",
    subtitle: "기획 & 설계",
    description:
      "정보 구조(IA), 와이어프레임, 기술 스택을 설계합니다. PRD와 ERD 기반의 체계적인 청사진으로 개발 전 모든 의사결정을 확정합니다.",
  },
  {
    num: "03",
    title: "Develop",
    subtitle: "개발 & 구현",
    description:
      "스프린트 단위로 개발을 진행하며, 매 주기마다 실물 프로토타입을 공유합니다. 클라이언트는 실시간으로 진행 상황을 확인하고 피드백할 수 있습니다.",
  },
  {
    num: "04",
    title: "Launch",
    subtitle: "배포 & 성장",
    description:
      "QA, 성능 최적화, SEO 세팅을 완료한 뒤 프로덕션에 배포합니다. 런칭 이후에도 모니터링과 유지보수를 통해 지속적인 성장을 지원합니다.",
  },
];

function StepCard({ step, idx }: { step: (typeof steps)[0]; idx: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["0 1", "1.1 1"],
  });
  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [80, 0]);

  return (
    <motion.div
      ref={ref}
      style={{ opacity, y }}
      className="group relative flex flex-col gap-6 flex-1 min-w-[260px]"
    >
      {/* Step number */}
      <div className="flex items-center gap-4">
        <span className="font-display text-6xl md:text-7xl tracking-tighter text-accent/20 group-hover:text-accent/60 transition-colors duration-500">
          {step.num}
        </span>
      </div>

      {/* Divider line */}
      <div className="w-full h-[1px] bg-[#E7E5DF]/10 group-hover:bg-accent/30 transition-colors duration-500" />

      {/* Content */}
      <div className="flex flex-col gap-3">
        <h3 className="font-display text-2xl md:text-3xl uppercase tracking-tighter group-hover:text-accent transition-colors duration-300">
          {step.title}
        </h3>
        <span className="font-mono text-xs tracking-widest uppercase text-[#E7E5DF]/40">
          {step.subtitle}
        </span>
        <p className="font-sans text-sm md:text-base leading-relaxed text-[#E7E5DF]/70 mt-2">
          {step.description}
        </p>
      </div>

      {/* Connector arrow (not on last) */}
      {idx < steps.length - 1 && (
        <div className="hidden xl:block absolute -right-8 top-1/2 -translate-y-1/2 text-[#E7E5DF]/10">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M1 8H15M15 8L9 2M15 8L9 14" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>
      )}
    </motion.div>
  );
}

export function Process() {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress: entryProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "start start"],
  });
  const { scrollYProgress: exitProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const entryOpacity = useTransform(entryProgress, [0.8, 1], [0, 1]);
  const exitOpacity = useTransform(exitProgress, [0, 0.1], [1, 0]);
  const headerOpacity = useTransform(
    [entryOpacity, exitOpacity],
    ([en, ex]) => Math.min(en as number, ex as number)
  );
  const headerY = useTransform(exitOpacity, [0, 1], ["-100%", "0%"]);

  return (
    <section
      ref={containerRef}
      id="process"
      className="w-full min-h-screen bg-[#0a0b0a] text-[#E7E5DF] flex flex-col relative border-t border-[#E7E5DF]/5"
    >
      <motion.div
        style={{ y: headerY, opacity: headerOpacity }}
        className="sticky top-0 w-full z-[80] pointer-events-none"
      >
        <div className="pointer-events-auto">
          <Navbar
            bgClass="bg-[#0a0b0a]/90 backdrop-blur-md border-b border-[#E7E5DF]/5"
            positionClass="relative"
          />
        </div>
      </motion.div>

      <div className="flex-1 flex flex-col justify-center py-20 md:py-32 px-4 md:px-12">
        {/* Section header */}
        <div className="flex flex-col mb-20 md:mb-28">
          <h2 className="font-display text-[9vw] md:text-[6vw] leading-[0.85] uppercase tracking-tighter text-accent mix-blend-difference">
            HOW WE <br /> WORK
          </h2>
          <p className="font-mono text-xs md:text-sm uppercase tracking-[0.2em] text-[#E7E5DF]/50 max-w-2xl mt-8">
            체계적인 4단계 프로세스로 아이디어를 프로덕트로 전환합니다. 모든 단계에서 투명한 커뮤니케이션을 보장합니다.
          </p>
        </div>

        {/* Steps grid */}
        <div className="flex flex-col xl:flex-row gap-12 xl:gap-16 max-w-7xl mx-auto w-full">
          {steps.map((step, idx) => (
            <StepCard key={step.num} step={step} idx={idx} />
          ))}
        </div>
      </div>
    </section>
  );
}
