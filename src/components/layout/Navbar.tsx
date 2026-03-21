"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

interface NavbarProps {
  bgClass?: string;
  positionClass?: string;
}

const navLinks = [
  { href: "#about", label: "ABOUT" },
  { href: "#portfolio", label: "WORK" },
  { href: "#process", label: "PROCESS" },
  { href: "#contact", label: "CONSULTING" },
];

export function Navbar({ bgClass = "bg-[#070808]/95 backdrop-blur-md border-b border-[#E7E5DF]/10", positionClass = "relative z-[80]" }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setMobileOpen(false);
    router.refresh();
  };

  const handleNavClick = (href: string) => {
    setMobileOpen(false);
    if (href.startsWith("#")) {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <header
        className={`${positionClass} w-full px-4 md:px-12 py-6 flex justify-between items-center transition-colors duration-300 ${bgClass}`}
      >
        {/* 1. Left: Metallic Logo */}
        <div className="pointer-events-auto">
          <button
            onClick={() => { setMobileOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}
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

        {/* 2. Center: Desktop Navigation */}
        <nav className="pointer-events-auto hidden md:flex items-center gap-6 font-mono text-sm tracking-[0.2em] text-[#E7E5DF] mix-blend-difference">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-accent transition-colors">
              [ {link.label} ]
            </Link>
          ))}
        </nav>

        {/* 3. Right: Login/Logout (Desktop) */}
        <div className="pointer-events-auto hidden md:flex items-center gap-4 mix-blend-difference">
          {isLoggedIn ? (
            <>
              <Link
                href="/portal"
                className="font-mono text-sm tracking-widest text-[#E7E5DF] hover:text-accent transition-colors"
              >
                PORTAL
              </Link>
              <button
                onClick={handleLogout}
                className="font-mono text-sm tracking-widest text-[#E7E5DF]/50 hover:text-accent transition-colors border-b border-[#E7E5DF]/30 hover:border-accent pb-1 cursor-pointer"
              >
                LOGOUT
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="font-mono text-sm tracking-widest text-[#E7E5DF] hover:text-accent transition-colors border-b border-[#E7E5DF] hover:border-accent pb-1"
            >
              LOGIN
            </Link>
          )}
        </div>

        {/* 4. Mobile Menu Toggle */}
        <div className="pointer-events-auto block md:hidden">
          <button
            onClick={() => setMobileOpen((prev) => !prev)}
            className="font-mono text-xs tracking-widest text-[#E7E5DF] hover:text-accent transition-colors"
          >
            [ {mobileOpen ? "CLOSE" : "MENU"} ]
          </button>
        </div>
      </header>

      {/* Mobile Fullscreen Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[90] bg-[#070808]/98 backdrop-blur-xl flex flex-col items-center justify-center gap-8 md:hidden"
          >
            {navLinks.map((link, idx) => (
              <motion.a
                key={link.href}
                href={link.href}
                onClick={(e) => { e.preventDefault(); handleNavClick(link.href); }}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, delay: idx * 0.07 }}
                className="font-display text-4xl uppercase tracking-tighter text-[#E7E5DF] hover:text-accent transition-colors"
              >
                {link.label}
              </motion.a>
            ))}

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, delay: navLinks.length * 0.07 }}
              className="mt-4 pt-8 border-t border-[#E7E5DF]/10 flex flex-col items-center gap-4"
            >
              {isLoggedIn ? (
                <>
                  <Link
                    href="/portal"
                    onClick={() => setMobileOpen(false)}
                    className="font-mono text-sm tracking-widest text-[#E7E5DF]/50 hover:text-accent transition-colors"
                  >
                    PORTAL →
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="font-mono text-sm tracking-widest text-[#E7E5DF]/30 hover:text-accent transition-colors cursor-pointer"
                  >
                    LOGOUT
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="font-mono text-sm tracking-widest text-[#E7E5DF]/50 hover:text-accent transition-colors"
                >
                  LOGIN →
                </Link>
              )}
            </motion.div>

            {/* Close button (top-right) */}
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-6 right-4 font-mono text-xs tracking-widest text-[#E7E5DF]/50 hover:text-accent transition-colors"
            >
              [ CLOSE ]
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
