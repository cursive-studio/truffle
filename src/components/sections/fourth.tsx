export default function FourthSection() {
    return (
        <section id="hardware" className="h-screen w-full flex pt-64 px-32 justify-between max-w-[1243px] relative">
            <p className="hidden text-left text-white/75 text-" style={{ fontFamily: 'var(--font-geist-pixel-triangle)', }}>
            There is no cloud, server, or gatekeeper. All processing is local and runs on your machine. Powered by Truffle1’s optimized processor equals full privacy, efficiency, and infinite inference time.
            </p>
            {/* glass panel */}
            <div className="w-[80vw] h-[80vh] border-2 border-white/10 bg-white/5 backdrop-blur-xs rounded-3xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            </div>
        </section>
    );
}
