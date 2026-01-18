'use client';

import { useState, useEffect, useRef } from 'react';

type BackgroundVideoPlayerProps = {
    videoUrl: string;
    poster?: string | null;
    className?: string; // For absolute positioning etc
};

export default function BackgroundVideoPlayer({ videoUrl, poster, className = '' }: BackgroundVideoPlayerProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [videoId, setVideoId] = useState<string | null>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Extract YouTube ID
    useEffect(() => {
        if (!videoUrl) return;

        // Handle various YouTube URL formats
        // https://www.youtube.com/watch?v=VIDEO_ID
        // https://youtu.be/VIDEO_ID
        // https://www.youtube.com/embed/VIDEO_ID
        let id = null;
        try {
            const url = new URL(videoUrl);
            if (url.hostname.includes('youtube.com')) {
                id = url.searchParams.get('v');
                if (!id && url.pathname.includes('/embed/')) {
                    id = url.pathname.split('/embed/')[1];
                }
            } else if (url.hostname.includes('youtu.be')) {
                id = url.pathname.slice(1);
            }
        } catch (e) {
            console.error('Invalid video URL', e);
            setHasError(true);
        }

        if (id) {
            setVideoId(id);
        } else {
            setHasError(true);
        }
    }, [videoUrl]);

    // Handle iframe load
    const handleLoad = () => {
        setIsLoading(false);
    };

    if (hasError || !videoId) {
        // Fallback to purely the poster image if provided, or nothing
        // The parent usually has the image as a background already, so we can just return null
        return null;
    }

    return (
        <div className={`absolute inset-0 overflow-hidden ${className}`}>
            {/* 
                YouTube Embed Parameters for Background Video:
                - autoplay=1: Autoplay
                - mute=1: Muted (required for autoplay)
                - controls=0: Hide controls
                - loop=1: Loop
                - playlist=ID: Required for loop to work
                - showinfo=0: Hide title
                - modestbranding=1: Minimal branding
                - playsinline=1: iOS support
                - rel=0: No related videos from others
             */}
            {/* Loading / Poster Overlay */}
            {isLoading && poster && (
                <div
                    className="absolute inset-0 bg-cover bg-center z-20 transition-opacity duration-1000"
                    style={{ backgroundImage: `url(${poster})` }}
                />
            )}

            <div className={`absolute inset-0 transition-opacity duration-1000 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
                <iframe
                    ref={iframeRef}
                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&showinfo=0&modestbranding=1&playsinline=1&rel=0&enablejsapi=1`}
                    className="absolute w-[300%] h-[300%] top-[-100%] left-[-100%] pointer-events-none object-cover min-w-full min-h-full"
                    style={{
                        width: '100%',
                        height: '100%',
                    }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    onLoad={handleLoad}
                />
            </div>
        </div>
    );
}
