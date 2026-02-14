"use client";

import { useState, useEffect } from "react";
import { MainCanvas } from "@/components/MainCanvas";
import {
  DEFAULT_SCROLL_POINTS,
  type ScrollPoint,
} from "@/config/scrollPoints";
import FirstSection from "@/components/sections/first";
import SecondSection from "@/components/sections/second";
import ThirdSection from "@/components/sections/third";
import FourthSection from "@/components/sections/fourth";
import FifthSection from "@/components/sections/fifth";
import Footer from "@/components/footer";
import { HeroScene } from "@/components/HeroScene";
import { HeroCanvas } from "@/components/HeroCanvas";

const sections = [
  {
    id: 1,
    component: <FirstSection />,
  },
  {
    id: 2,
    component: <SecondSection />,
  },

  {
    id: 3,
    component: <ThirdSection />,
  },
  {
    id: 4,
    component: <FourthSection />,
  },
  {
    id: 5,
    component: <FifthSection />,
  },
]

/** Number of full-viewport sections that slide in from the right. */
const SECTION_COUNT = sections.length;

/** Viewport heights of scroll per section. Higher = more space between sections (e.g. 150 = 1.5x longer). */
const VH_PER_SECTION = 200;

/** Total vertical scroll height (vh). User scrolls down; content translates left. */
const TOTAL_SCROLL_VH = SECTION_COUNT * VH_PER_SECTION;

export default function Home() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll =
        (TOTAL_SCROLL_VH / 100) * window.innerHeight - window.innerHeight;
      const p =
        totalScroll <= 0
          ? 0
          : Math.min(1, Math.max(0, window.scrollY / totalScroll));
      setScrollProgress(p);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollPoints: ScrollPoint[] = DEFAULT_SCROLL_POINTS;

  /** Horizontal offset: at progress 0 show first section; at 1 show last. */
  const translateXPercent = -scrollProgress * (SECTION_COUNT - 1) * 100;

  return (
    <main className="relative w-screen overflow-x-hidden">
      {/* <div className="h-screen w-screen">
        <HeroCanvas
          scrollProgress={scrollProgress}
          modelPath="/models/ttrr3.fbx"
          modelType="fbx"
        />
      </div> */}
      {/* Fixed background: 3D model stays in place. */}
      <div className="fixed inset-0 z-0 h-screen w-screen">
        <MainCanvas
          modelPath="/models/truffle-os-latest.glb"
          modelType="glb"
          scrollProgress={scrollProgress}
          scrollPoints={scrollPoints}
        />

      </div>
      <div>

      </div>

      {/* Fixed viewport "window": horizontal strip slides right-to-left as user scrolls down. */}
      <div className="fixed inset-0 z-10 overflow-hidden">
        <div
          className="h-full flex flex-nowrap will-change-transform"
          style={{
            width: `${SECTION_COUNT * 100}vw`,
            transform: `translateX(${translateXPercent}vw)`,
          }}
        >
          {sections.map((section) => (
            <section key={section.id} className="flex shrink-0 w-full flex-col items-center justify-center px-6 py-20 text-center" style={{ width: "100vw" }}>
              {section.component}
            </section>
          ))}
          {/* {Array.from({ length: SECTION_COUNT }, (_, i) => (
            <section
              key={i}
              className="flex shrink-0 w-full flex-col items-center justify-center px-6 py-20 text-center"
              style={{ width: "100vw" }}
            >
              <h2 className="text-3xl font-semibold text-white drop-shadow-lg md:text-5xl">
                Section {i + 1}
              </h2>
              <p className="mt-4 max-w-xl text-lg text-white/90 drop-shadow">
                Scroll to discover. Sections slide in from the right.
              </p>
            </section>
          ))} */}
        </div>
      </div>

      {/* Invisible tall spacer: creates vertical scroll distance. */}
      <div
        className="relative z-0"
        style={{ height: `${TOTAL_SCROLL_VH}vh` }}
        aria-hidden
      />
        <Footer />
    </main>
  );
}
