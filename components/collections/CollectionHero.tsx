'use client';

import React from 'react';

interface CollectionHeroProps {
    title: string;
    subtitle?: string | null;
    imageUrl?: string | null;
    videoUrl?: string | null;
}

export const CollectionHero: React.FC<CollectionHeroProps> = ({
    title,
    subtitle,
    imageUrl,
    videoUrl
}) => {
    // Helper to get YouTube ID
    const getYouTubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const youtubeId = videoUrl ? getYouTubeId(videoUrl) : null;
    const isDirectVideo = videoUrl && (videoUrl.endsWith('.mp4') || videoUrl.endsWith('.webm'));

    // Case 1: Video Hero (YouTube)
    if (youtubeId) {
        return (
            <div className="relative h-[60vh] min-h-[400px] w-full overflow-hidden bg-black">
                <div className="absolute inset-0 pointer-events-none">
                    <iframe
                        className="w-full h-[150%] -translate-y-[15%] aspect-video"
                        src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&loop=1&playlist=${youtubeId}&controls=0&showinfo=0&rel=0&modestbranding=1`}
                        allow="autoplay; encrypted-media"
                        frameBorder="0"
                    />
                </div>
                <div className="absolute inset-0 bg-black/40 z-10" />
                <div className="relative z-20 h-full flex items-center">
                    <div className="section-container text-white">
                        <div className="max-w-4xl">
                            <h1 className="text-4xl md:text-6xl lg:text-7xl font-logo font-bold uppercase tracking-tighter mb-6">
                                {title}
                            </h1>
                            {subtitle && (
                                <p className="text-xl md:text-2xl text-white/90 font-medium max-w-2xl leading-relaxed">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Case 2: Video Hero (Direct MP4)
    if (isDirectVideo) {
        return (
            <div className="relative h-[60vh] min-h-[400px] w-full overflow-hidden bg-black">
                <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                >
                    <source src={videoUrl} type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-black/40 z-10" />
                <div className="relative z-20 h-full flex items-center">
                    <div className="section-container text-white">
                        <div className="max-w-4xl">
                            <h1 className="text-4xl md:text-6xl lg:text-7xl font-logo font-bold uppercase tracking-tighter mb-6">
                                {title}
                            </h1>
                            {subtitle && (
                                <p className="text-xl md:text-2xl text-white/90 font-medium max-w-2xl leading-relaxed">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const [imageError, setImageError] = React.useState(false);

    // Case 3: Image Hero
    if (imageUrl && !imageError) {
        return (
            <div className="relative h-[60vh] min-h-[400px] w-full overflow-hidden">
                <img
                    src={imageUrl}
                    alt={title}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={() => setImageError(true)}
                />
                <div className="absolute inset-0 bg-black/40 z-10" />
                <div className="relative z-20 h-full flex items-center">
                    <div className="section-container text-white">
                        <div className="max-w-4xl">
                            <h1 className="text-4xl md:text-6xl lg:text-7xl font-logo font-bold uppercase tracking-tighter mb-6">
                                {title}
                            </h1>
                            {subtitle && (
                                <p className="text-xl md:text-2xl text-white/90 font-medium max-w-2xl leading-relaxed">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Case 4: Minimal Header (No Media)
    return (
        <div className="bg-deep-navy pt-32 pb-16">
            <div className="section-container">
                <div className="max-w-4xl">
                    <h1 className="text-4xl md:text-5xl font-logo font-bold text-white mb-6 uppercase tracking-tight">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="text-lg md:text-xl text-white/70 max-w-2xl">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};
