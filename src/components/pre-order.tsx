export default function PreOrder() {
    return (
        <div className="fixed bottom-10 left-10 rounded-full p-4 minw-[380px] flex flex-col gap-4">
            <div>
            <p className="text-white text-3xl flex items-start">Truffle<span className="text-[8px] ">1</span></p>
            <p>Available for pre-order</p>
            </div>

            <button className="bg-white text-black px-4 py-2 rounded-full text-sm" style={{ fontFamily: 'var(--font-geist-pixel-triangle)', fontSize: '12px', }}> 
                pre-order now
            </button>
        </div>
    )
}