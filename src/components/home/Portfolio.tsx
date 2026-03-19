"use client";

import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import Image from "next/image";
import { Navbar } from "@/components/layout/Navbar";

// Portfolio Data Type
type Project = {
  id: string;
  title: string;
  category: string;
  description: string;
  challenge: string;
  solution: string;
  features: string[];
  images: string[];
};

const projects: Project[] = [
  {
    id: "01",
    title: "Commerce D2C",
    category: "E-commerce & Payments",
    description: "글로벌 럭셔리 화장품 편집샵의 브랜드 가치를 극대화한 몰입형 커머스 경험. 감각적인 인터랙션과 3D 기술을 접목하여 브랜드 스토리와 제품 탐색을 하나로 연결했습니다.",
    challenge: "단순한 상품 나열을 넘어 브랜드의 고유한 감도와 세계관을 디지털 환경에서 몰입감 있게 전달하는 데 어려움이 있었습니다.",
    solution: "하프앤하프 캐러셀과 Three.js 기반의 3D 제품 뷰어를 도입하여, 사용자가 브랜드 스토리와 제품을 입체적으로 탐색할 수 있는 감각적인 경험을 구현했습니다.",
    features: ["Next.js 15", "Tailwind CSS v4", "Three.js", "Framer Motion", "Supabase"],
    images: [
      "/commerce1.jpg",
      "/commerce2.jpg",
      "/commerce3.jpg",
      "/commerce4.jpg"
    ]
  },
  {
    id: "02",
    title: "SaaS Project",
    category: "Performance Marketing SaaS",
    description: "조회수 기반의 퍼포먼스 마케팅 성과를 실시간으로 추적하고 정산하는 투명한 크리에이터 생태계를 구축했습니다. SNS 공식 API와 AI 기술을 결합하여 데이터 신뢰성과 운영 효율을 극대화했습니다.",
    challenge: "기존 마케팅 시장의 불투명한 성과 측정 방식과 수동 정산 프로세스로 인한 신뢰 저하 및 운영 리소스 낭비가 심각했습니다.",
    solution: "YouTube, Instagram, TikTok 공식 API를 연동하여 실시간 조회수를 검증하고, PortOne 파트너 정산 시스템을 통해 자동화된 수익 분배 구조를 설계했습니다. 또한 Gemini AI를 이용한 콘텐츠 분석 기능을 제공합니다.",
    features: ["React", "Express", "Drizzle ORM", "Gemini AI", "PortOne"],
    images: [
      "/saas1.jpg",
      "/saas2.jpg",
      "/saas3.jpg",
      "/saas4.jpg"
    ]
  },
  {
    id: "03",
    title: "Education LMS",
    category: "Career Consulting & LMS",
    description: "한양대학교 학생들을 위한 커리어 컨설팅 예약 및 학습 관리 플랫폼을 구축했습니다. 학생·컨설턴트·코디네이터·관리자 4개 역할 기반의 상담 예약 시스템과 Vimeo 연동 LMS, 설문조사, 실시간 알림까지 통합한 올인원 교육 포털입니다.",
    challenge: "4개 역할별 복잡한 권한 체계와 상담 예약 시 동시성 충돌(오버부킹) 문제, 그리고 48시간 취소 규칙 등 비즈니스 로직이 복잡하게 얽혀 있어 안정적인 상태 관리가 핵심 과제였습니다.",
    solution: "Drizzle ORM과 PostgreSQL 트랜잭션으로 예약 동시성을 제어하고, WebSocket 기반 실시간 알림과 Zoom 연동 화상 상담, Firebase Storage 파일 관리, Channel.io 채팅까지 통합하여 원스톱 컨설팅 환경을 완성했습니다.",
    features: ["React", "Express", "Drizzle ORM", "PostgreSQL", "Firebase", "WebSocket"],
    images: [
      "/lms1.jpg",
      "/lms2.jpg",
      "/lms3.jpg",
      "/lms4.jpg",
      "/lms5.jpg",
      "/lms6.jpg",
      "/lms7.jpg",
      "/lms8.jpg"
    ]
  },
  {
    id: "04",
    title: "Local Commerce",
    category: "AI Bidding & Local Commerce",
    description: "Gemini AI 챗봇이 고객의 취향을 분석해 식물을 추천하고, Google Maps 기반으로 주변 꽃집에 실시간 입찰을 요청하는 로컬 커머스 플랫폼을 구축했습니다. 판매자 대시보드, PortOne 결제, 선물하기까지 통합한 O2O 생태계입니다.",
    challenge: "AI 대화형 추천과 위치 기반 매장 매칭, 입찰-결제-배송의 복잡한 주문 흐름을 하나의 플랫폼에서 매끄럽게 연결하는 것이 핵심 과제였습니다. 사업자 인증, 계좌 인증 등 판매자 온보딩 프로세스도 중요했습니다.",
    solution: "Gemini AI로 대화형 식물 추천 엔진을 구현하고, Google Maps API로 반경 기반 매장 탐색 및 입찰 시스템을 설계했습니다. PortOne·NicePay 이중 결제 연동과 카카오/구글 OAuth, 실시간 채팅까지 풀스택으로 완성했습니다.",
    features: ["React", "Express", "Gemini AI", "Google Maps", "PortOne", "PostgreSQL"],
    images: [
      "/local1.jpg",
      "/local2.jpg",
      "/local3.jpg",
      "/local4.jpg",
      "/local5.jpg",
      "/local6.jpg",
      "/local7.jpg"
    ]
  },
  {
    id: "05",
    title: "Algorithmic Trading",
    category: "Workflow Automation",
    description: "n8n 워크플로우 자동화 플랫폼을 Self-hosted로 구축하여, 거래소 데이터 수집부터 기술적 지표 분석, 자동 매매, Slack 알림까지 전 과정을 노코드 파이프라인으로 연결했습니다.",
    challenge: "다양한 거래소 API와 데이터 소스를 하나의 흐름으로 통합하고, 24시간 무중단으로 안정적인 자동 매매 파이프라인을 운영해야 했습니다.",
    solution: "n8n을 독자 서버에 Self-hosted로 배포하고, HTTP Request·Code·Webhook 노드를 조합해 거래소 API 연동, Python 기반 지표 계산, 조건부 매매 실행, Slack 실시간 리포트까지 하나의 워크플로우로 완성했습니다.",
    features: ["n8n", "Python", "Trading API", "Slack API"],
    images: [
      "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=2070&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=2070&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop",
      "/trading1.jpg",
      "/trading2.jpg",
      "/trading3.jpg"
    ]
  },
];

function ProjectCard({ project, idx, onClick }: { project: Project; idx: number, onClick: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["0 1", "1.1 1"],
  });

  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [120, 0]);
  
  const isEven = idx % 2 === 0;

  return (
    <motion.div
      ref={ref}
      style={{ opacity, y }}
      onClick={onClick}
      className={`group relative flex flex-col ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} gap-8 md:gap-16 items-center w-full py-20 px-4 md:px-12 border-b border-[#E7E5DF]/10 cursor-pointer`}
    >
      {/* 썸네일/이미지 영역 (대표 이미지 1장) */}
      <div className="w-full md:w-1/2 aspect-video relative overflow-hidden bg-white/5 group-hover:bg-white/10 transition-colors duration-500">
        <Image 
          src={project.images[0]} 
          alt={project.title} 
          fill 
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] scale-105 group-hover:scale-100 opacity-60 group-hover:opacity-100" 
        />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-black/40 z-10">
          <span className="font-mono text-sm tracking-widest uppercase text-white shadow-sm border border-white/20 px-6 py-3 rounded-full backdrop-blur-sm">View Project</span>
        </div>
      </div>
      
      {/* 텍스트 컨텐츠 영역 */}
      <div className="w-full md:w-1/2 flex flex-col justify-center">
        <span className="font-mono text-xs md:text-sm text-[#E7E5DF]/50 mb-4 tracking-widest uppercase">
          [ {project.id} — {project.category} ]
        </span>
        <h3 className="font-display text-4xl md:text-6xl uppercase tracking-tighter mb-6 group-hover:text-accent transition-colors duration-300">
          {project.title}
        </h3>
        <p className="font-sans text-[#E7E5DF]/80 text-sm md:text-base leading-relaxed max-w-lg mb-8">
          {project.description}
        </p>
        
        <div className="flex flex-wrap gap-2">
          {project.features.map((feature: string, fIdx: number) => (
            <span 
              key={fIdx} 
              className="font-mono text-[10px] md:text-xs uppercase tracking-wider px-3 py-1.5 border border-[#E7E5DF]/20 rounded-full text-[#E7E5DF]/70 group-hover:border-accent/50 group-hover:text-accent transition-colors duration-300"
            >
              {feature}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export function Portfolio() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [curImageIdx, setCurImageIdx] = useState(0);

  const closeModal = () => {
    setSelectedProject(null);
    setCurImageIdx(0);
  };

  // 섹션 스크롤 위치 (헤더 숨기기용)
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

  const nextImage = (len: number) => setCurImageIdx((prev) => (prev + 1) % len);

  return (
    <section ref={containerRef} id="portfolio" className="w-full min-h-screen bg-[#0f1211] text-[#E7E5DF] flex flex-col relative border-t border-[#E7E5DF]/5">
      <motion.div 
        style={{ y: headerY, opacity: headerOpacity }} 
        className="sticky top-0 w-full z-[80] pointer-events-none"
      >
        <div className="pointer-events-auto">
          <Navbar bgClass="bg-[#0f1211]/90 backdrop-blur-md border-b border-[#E7E5DF]/5" positionClass="relative" />
        </div>
      </motion.div>
      <div className="w-full flex-1 py-12 md:py-20 pb-40">
        <div className="flex flex-col mb-16 px-4 md:px-12">
        <h2 className="font-display text-[10vw] leading-[0.85] uppercase tracking-tighter text-accent mix-blend-difference">
          SELECTED <br/> WORKS
        </h2>
        <p className="font-mono text-xs md:text-sm uppercase tracking-[0.2em] text-[#E7E5DF]/50 max-w-2xl mt-8">
          단순 웹사이트 제작을 넘어, 비즈니스 코어와 맞닿은 난이도 높은 기능들을 안정적으로 설계하고 서비스한 사례입니다.
        </p>
      </div>

      <div className="flex flex-col border-t border-[#E7E5DF]/10 overflow-hidden">
        {projects.map((project, idx) => (
          <ProjectCard 
            key={project.id} 
            project={project} 
            idx={idx} 
            onClick={() => { setSelectedProject(project); setCurImageIdx(0); }}
          />
        ))}
      </div>

      <AnimatePresence>
        {selectedProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-12 overflow-y-auto bg-black/80 backdrop-blur-md"
          >
            {/* Modal Container */}
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-7xl bg-[#0f1211] border border-white/10 mx-auto min-h-[85vh] p-6 md:p-16 flex flex-col xl:flex-row gap-12 xl:gap-20 shadow-2xl rounded-sm"
            >
              {/* 안전한 모달 내부 Close 버튼 */}
              <button 
                onClick={closeModal}
                className="absolute top-6 right-6 font-mono text-xs tracking-widest uppercase text-[#E7E5DF]/50 hover:text-accent transition-colors z-[60] flex items-center gap-2 group"
              >
                <span className="w-6 h-[1px] bg-current transition-all group-hover:w-8"></span>
                CLOSE
              </button>
              
              {/* 1. 이미지 슬라이더 영역 */}
              <div className="w-full xl:w-[55%] flex flex-col gap-8 pt-12 xl:pt-0">
                <div 
                  className="w-full aspect-video relative overflow-hidden bg-white/5 border border-white/10 group cursor-pointer"
                  onClick={() => nextImage(selectedProject.images.length)}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={curImageIdx}
                      initial={{ opacity: 0, scale: 1.05 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      className="absolute inset-0"
                    >
                      <Image 
                        src={selectedProject.images[curImageIdx]}
                        alt={`${selectedProject.title} image ${curImageIdx + 1}`}
                        fill
                        sizes="(max-width: 1280px) 100vw, 55vw"
                        className="object-contain bg-black/20"
                      />
                    </motion.div>
                  </AnimatePresence>
                  {/* 중앙 클릭 유도 커서/아이콘 (옵션) */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                     <span className="bg-black/50 backdrop-blur-md text-white px-4 py-2 font-mono text-xs tracking-widest uppercase rounded-full border border-white/20">
                       Click to Next
                     </span>
                  </div>
                </div>
                
                {/* 고급스러운 Line형(또는 큰 Dot형) Dot Navigation */}
                <div className="flex gap-4 justify-center items-center h-6">
                  {selectedProject.images.map((_, dotIdx) => (
                    <button
                      key={dotIdx}
                      onClick={() => setCurImageIdx(dotIdx)}
                      className={`h-1.5 transition-all duration-[400ms] ease-out relative overflow-hidden cursor-pointer rounded-full ${
                        curImageIdx === dotIdx ? 'w-12 bg-accent' : 'w-6 bg-white/20 hover:w-10 hover:bg-white/50'
                      }`}
                      aria-label={`Go to image ${dotIdx + 1}`}
                    />
                  ))}
                </div>
              </div>
              
              {/* 2. 에이전시 전문성 데이터 텍스트 영역 */}
              <div className="w-full xl:w-[45%] flex flex-col pt-4 xl:pt-[4%]">
                <span className="font-mono text-xs xl:text-sm text-accent mb-4 tracking-widest uppercase flex items-center gap-3">
                  <span className="w-8 h-[1px] bg-accent"></span>
                  {selectedProject.category}
                </span>
                <h3 className="font-display text-5xl xl:text-7xl uppercase tracking-tighter mb-12 xl:mb-16">
                  {selectedProject.title}
                </h3>

                {/* Challenge & Solution (KPI 삭제 후 이 영역을 부각) */}
                <div className="flex flex-col gap-10 mb-12 border-t border-white/10 pt-10">
                  <div className="flex flex-col gap-4">
                    <h4 className="font-mono text-xs tracking-widest uppercase text-white/40 flex items-center gap-2">
                       <span className="w-1 h-1 rounded-full bg-white/40"></span>
                       The Challenge
                    </h4>
                    <p className="font-sans text-sm xl:text-base leading-loose text-[#E7E5DF]/80 font-medium">
                      {selectedProject.challenge}
                    </p>
                  </div>
                  <div className="flex flex-col gap-4">
                    <h4 className="font-mono text-xs tracking-widest uppercase text-accent/80 flex items-center gap-2">
                       <span className="w-1 h-1 rounded-full bg-accent/80"></span>
                       The Solution
                    </h4>
                    <p className="font-sans text-sm xl:text-base leading-loose text-[#E7E5DF]/80 font-medium">
                      {selectedProject.solution}
                    </p>
                  </div>
                </div>

                {/* Tech Stack */}
                <div className="mt-auto">
                  <h4 className="font-mono text-xs tracking-widest uppercase text-white/30 mb-4 border-b border-white/5 pb-2">Technologies Used</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.features.map((feature: string, fIdx: number) => (
                      <span 
                        key={fIdx} 
                        className="font-mono text-[10px] xl:text-xs uppercase tracking-wider px-4 py-2 bg-white/5 rounded-full text-[#E7E5DF]/70 border border-white/10 hover:border-accent/40 hover:text-accent transition-colors"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </section>
  );
}
