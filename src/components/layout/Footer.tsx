import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full py-12 px-6 border-t border-white/10 mt-24">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-xl font-bold tracking-tighter text-white">
            STUDIO HAETAE
          </span>
          <span className="text-sm text-white/50">
            Guardians of Innovation, Architects of Scale.
          </span>
        </div>
        <div className="flex items-center gap-6 text-sm font-medium text-white/60">
          <Link href="#" className="hover:text-white transition-colors">
            Instagram
          </Link>
          <Link href="#" className="hover:text-white transition-colors">
            Threads
          </Link>
          <Link href="mailto:hello@studiohaetae.com" className="hover:text-white transition-colors">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}
