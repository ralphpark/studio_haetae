import { Hero } from "@/components/home/Hero";
import dynamic from "next/dynamic";

const About = dynamic(() => import("@/components/home/About").then((mod) => mod.About));
const Portfolio = dynamic(() => import("@/components/home/Portfolio").then((mod) => mod.Portfolio));
const Process = dynamic(() => import("@/components/home/Process").then((mod) => mod.Process));
const Contact = dynamic(() => import("@/components/home/Contact").then((mod) => mod.Contact));

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center w-full">
      <Hero />
      <About />
      <Portfolio />
      <Process />
      <Contact />
    </div>
  );
}
