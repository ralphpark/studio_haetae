"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Navbar } from "@/components/layout/Navbar";

export function About() {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress: entryProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "start start"]
  });
  const { scrollYProgress: exitProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  // 진입 시: 상단 20% 지점(0.8)부터 나타나서 0vh(1.0)에 도달하면 1
  const entryOpacity = useTransform(entryProgress, [0.8, 1], [0, 1]);
  // 퇴출 시: 0vh(0)에서 시작해서 스크롤이 10% 진행(0.1)되면 0
  const exitOpacity = useTransform(exitProgress, [0, 0.1], [1, 0]);
  
  // 두 상태의 최솟값을 사용하여 진입/퇴출 시 모두 자연스럽게 노출/숨김
  const headerOpacity = useTransform([entryOpacity, exitOpacity], ([en, ex]) => Math.min(en as number, ex as number));
  const headerY = useTransform(exitOpacity, [0, 1], ["-100%", "0%"]);

  return (
    <section ref={containerRef} id="about" className="w-full min-h-screen bg-[#070808] text-[#E7E5DF] flex flex-col border-t border-[#E7E5DF]/10 relative">
      {/* Scroll-linked Sticky Header */}
      <motion.div 
        style={{ y: headerY, opacity: headerOpacity }} 
        className="sticky top-0 w-full z-[80] pointer-events-none"
      >
        <div className="pointer-events-auto">
          <Navbar bgClass="bg-[#070808]/90 backdrop-blur-md border-b border-[#E7E5DF]/10" positionClass="relative" />
        </div>
      </motion.div>

      <div className="flex-1 flex items-center py-20 md:py-32 px-4 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-16 md:gap-32 w-full">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-16 md:gap-24 w-full"
          >
            {/* 타이틀 영역 */}
            <div>
              <h2 className="font-display text-[9vw] md:text-[6vw] leading-[0.85] uppercase tracking-tighter mix-blend-difference text-accent">
                THE ARCHITECT <br/> OF SCALE
              </h2>
            </div>
            
            {/* 본문/상세 영역 */}
            <div className="flex flex-col md:flex-row gap-12 md:gap-20 font-mono text-sm md:text-base leading-relaxed opacity-90">
              {/* 1. 웹 에이전시 파트 */}
              <div className="flex-1 group">
                <div className="flex items-center gap-4 mb-6">
                  <span className="w-8 h-[1px] bg-accent transition-all duration-500 group-hover:w-16"></span>
                  <p className="uppercase tracking-widest text-accent text-xs md:text-sm">
                    [ Business Partner ]
                  </p>
                </div>
                <p className="font-sans font-medium text-lg leading-loose">
                  12년 간의 대기업 연구원 근무 경력에서 비롯된 완벽하고 매끄러운 커뮤니케이션 능력으로, 일회성 프로젝트가 아닌 비즈니스의 확장을 함께합니다.<br/>
                  현재 스타트업 CTO로 재직 중인 현업 개발자의 감각과 압도적 기술력을 바탕으로, 아이디어를 완벽한 프로덕트로 스케일업하는 프리미엄 파트너십을 제공합니다.
                </p>
              </div>
              
              {/* 2. 자동화 서비스 파트 */}
              <div className="flex-1 group">
                <div className="flex items-center gap-4 mb-6">
                  <span className="w-8 h-[1px] bg-accent transition-all duration-500 group-hover:w-16"></span>
                  <p className="uppercase tracking-widest text-accent text-xs md:text-sm">
                    [ Workflow Automation ]
                  </p>
                </div>
                <p className="font-sans font-medium text-lg leading-loose">
                  코드 너머의 효율을 만듭니다. 우리는 복잡한 비즈니스 로직에 AI와 워크플로우 자동화를 도입하여 운영 리소스를 최소화합니다.
                  클라이언트는 이제 본연의 비즈니스 가치에만 집중하십시오. 기술은 우리가 책임집니다.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
