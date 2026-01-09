export function ShopHero({ title }: { title: string }) {
    return (
        <div className="relative w-full h-[300px] bg-gray-900 flex items-center justify-center overflow-hidden mb-0">
            <div
                className="absolute inset-0 bg-cover bg-center opacity-60"
                style={{ backgroundImage: "url('https://slingshotsports.com/cdn/shop/collections/Kite_Collection_Header_2.jpg?v=1684347895')" }}
            />
            <div className="absolute inset-0 bg-black/30" />

            <div className="relative z-10 text-center text-white px-4">
                <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-4 shadow-sm">
                    Shop / <span className="text-accent">{title}</span>
                </h1>
            </div>
        </div>
    );
}
