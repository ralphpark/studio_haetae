"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { useRef } from "react";
import { Navbar } from "@/components/layout/Navbar";

export function Hero() {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "80%"]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.8]);
  
  const headerY = useTransform(scrollYProgress, [0, 0.15], ["0%", "-100%"]);
  const headerOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);

  return (
    <section ref={containerRef} className="relative w-full min-h-[100svh] flex flex-col items-center justify-center overflow-hidden bg-[#070808]">
      {/* Scroll-linked Header - Absolute to avoid layout shift */}
      <motion.div 
        style={{ y: headerY, opacity: headerOpacity }} 
        className="absolute top-0 left-0 w-full z-[80] pointer-events-none"
      >
        <div className="pointer-events-auto">
          <Navbar bgClass="bg-transparent" positionClass="relative" />
        </div>
      </motion.div>

      {/* 1. 수직 텍스트 (Vertical Accent) - 폭이 넓은 화면에서만 표시 */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5, duration: 1 }}
        style={{ opacity: textOpacity }}
        className="absolute left-4 md:left-12 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-4 text-accent font-mono text-xs tracking-[0.3em] origin-center -rotate-90 whitespace-nowrap"
      >
        <span>EST. 2024</span>
        <span className="w-12 h-[1px] bg-accent"></span>
        <span>SEOUL, KR</span>
      </motion.div>

      {/* 우측 수직 텍스트 (Vertical Accent) */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5, duration: 1 }}
        style={{ opacity: textOpacity }}
        className="absolute right-4 md:right-12 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-4 text-accent font-mono text-xs tracking-[0.3em] origin-center rotate-90 whitespace-nowrap"
      >
        <span>SCROLL TO EXPLORE</span>
        <span className="w-12 h-[1px] bg-accent"></span>
      </motion.div>

      {/* 2. 중앙 메인 컨텐츠 영역 */}
      <div className="z-10 flex flex-col items-center text-center px-4 w-full">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          style={{ y: textY, opacity: textOpacity, scale: scale }}
          className="flex flex-col items-center justify-center w-full mix-blend-difference"
        >
          {/* Giant Typography (Mason Wong Style) */}
          <h1 className="font-display text-[16vw] md:text-[14vw] leading-[0.85] tracking-tight text-[#E7E5DF] flex flex-col items-center custom-cursor-text">
            <motion.span 
              whileHover={{ scale: 1.02, color: "var(--color-accent)" }} 
              transition={{ duration: 0.4 }}
              className="block cursor-default"
            >
              STUDIO
            </motion.span>
            <motion.span 
              whileHover={{ scale: 1.02, color: "#ffffff" }} 
              transition={{ duration: 0.4 }}
              className="block cursor-default text-accent"
            >
              HAETAE
            </motion.span>
          </h1>

          {/* Subtext (Roboto Mono) */}
          <div className="mt-8 md:mt-12 flex flex-col items-center gap-4">
            <p className="max-w-xl text-center text-sm md:text-base text-[#E7E5DF]/90 font-mono tracking-widest uppercase leading-relaxed font-bold">
              Beyond Code, We Build Your Business.<br/>
              <span className="block mt-2 font-sans font-medium text-xs md:text-sm text-[#E7E5DF]/70 normal-case tracking-normal">
                단순한 개발을 넘어, 비즈니스의 진짜 성장을 짓습니다.
              </span>
            </p>
            <p className="mt-6 max-w-md text-[10px] md:text-xs text-[#E7E5DF]/50 font-mono tracking-widest uppercase leading-relaxed">
              Premium Web Agency<br />
              & Workflow Automation<br />
              <span className="block mt-2 font-sans text-white/30 tracking-normal normal-case">웹 에이전시 • 자동화 서비스 제작</span>
            </p>
          </div>

          {/* Call to Action Button */}
          <div className="mt-12 md:mt-16">
            <Link 
              href="#contact" 
              className="px-8 py-3 bg-transparent border border-[#E7E5DF]/30 rounded-full text-[#E7E5DF] font-mono text-xs uppercase tracking-widest hover:bg-accent hover:text-black transition-all duration-300"
            >
              Start Project
            </Link>
          </div>
        </motion.div>
      </div>

      {/* 3. 장식용 요소들 (Geometric accents) */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
        <div className="absolute top-0 left-1/2 w-[1px] h-full bg-gradient-to-b from-[#E7E5DF]/20 to-transparent"></div>
        <div className="absolute top-1/4 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#E7E5DF]/10 to-transparent"></div>
        <div className="absolute bottom-1/4 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#E7E5DF]/10 to-transparent"></div>
      </div>
    </section>
  );
}
