"use client";

import { TestModelScene } from "@/components/TestModelScene";

/** Test page: glossy translucent shell + visible internals + studio rim lighting + pure black background. */
export default function TestPage() {
  return (
    <main className="relative w-screen h-screen overflow-hidden">
      <TestModelScene />
    </main>
  );
}
