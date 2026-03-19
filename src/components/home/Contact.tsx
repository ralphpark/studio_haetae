"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { ContactForm } from "@/components/home/ContactForm";

export function Contact() {
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
      id="contact"
      className="w-full min-h-screen bg-black text-[#E7E5DF] flex flex-col relative overflow-hidden border-t border-[#E7E5DF]/5"
    >
      {/* Scroll-linked Sticky Header */}
      <motion.div
        style={{ y: headerY, opacity: headerOpacity }}
        className="sticky top-0 w-full z-[80] pointer-events-none"
      >
        <div className="pointer-events-auto">
          <Navbar
            bgClass="bg-black/90 backdrop-blur-md border-b border-[#E7E5DF]/5"
            positionClass="relative"
          />
        </div>
      </motion.div>

      {/* Glow effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-[400px] bg-white/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-20 md:py-32 relative z-10">
        <div className="text-center mb-16 flex flex-col items-center gap-4">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter">
            Ready to <span className="text-transparent bg-clip-text bg-gradient-to-r from-white/90 to-white/40">Scale?</span>
          </h2>
          <p className="text-white/50 text-lg md:text-xl max-w-2xl">
            어떤 비즈니스든 최적의 기술 솔루션이 있습니다.<br />
            지금 바로 AI 상담 폼을 통해 맞춤형 기획안을 무료로 받아보세요.
          </p>
        </div>
        <ContactForm />
      </div>
    </section>
  );
}
