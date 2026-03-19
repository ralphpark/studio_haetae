"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

interface NavbarProps {
  bgClass?: string;
  positionClass?: string;
}

export function Navbar({ bgClass = "bg-[#070808]/95 backdrop-blur-md border-b border-[#E7E5DF]/10", positionClass = "relative z-[80]" }: NavbarProps) {
  return (
    <header 
      className={`${positionClass} w-full px-4 md:px-12 py-6 flex justify-between items-center transition-colors duration-300 ${bgClass}`}
    >
      
      {/* 1. Left: Metallic Logo */}
      <div className="pointer-events-auto">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="block transition-transform hover:scale-105 active:scale-95 cursor-pointer"
        >
          <Image
            src="/logo-v5.png"
            alt="Studio HaeTae Logo"
            width={400}
            height={400}
            className="w-auto h-12 md:h-20 object-contain drop-shadow-2xl"
            priority
          />
        </button>
      </div>

      {/* 2. Center: Minimal Dense Typography Navigation */}
      <nav className="pointer-events-auto hidden md:flex items-center gap-6 font-mono text-sm tracking-[0.2em] text-[#E7E5DF] mix-blend-difference">
        <Link href="#about" className="hover:text-accent transition-colors">
          [ ABOUT ]
        </Link>
        <Link href="#portfolio" className="hover:text-accent transition-colors">
          [ WORK ]
        </Link>
        <Link href="#process" className="hover:text-accent transition-colors">
          [ PROCESS ]
        </Link>
        <Link href="#contact" className="hover:text-accent transition-colors">
          [ CONSULTING ]
        </Link>
      </nav>

      {/* 3. Right: Contact Button / Call to Action */}
      <div className="pointer-events-auto hidden md:block mix-blend-difference">
        <Link
          href="/login"
          className="font-mono text-sm tracking-widest text-[#E7E5DF] hover:text-accent transition-colors border-b border-[#E7E5DF] hover:border-accent pb-1"
        >
          LOGIN
        </Link>
      </div>

      {/* Mobile Menu Toggle (기본 구조만) */}
      <div className="pointer-events-auto block md:hidden mix-blend-difference">
        <button className="font-mono text-xs tracking-widest text-[#E7E5DF]">
          [ MENU ]
        </button>
      </div>
    </header>
  );
}
