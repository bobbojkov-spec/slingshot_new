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

    // Handle iframe load with a delay to ensure video is actually rendering
    const handleLoad = () => {
        // Small delay to prevent "black flash" before video actually starts rendering frames
        setTimeout(() => {
            setIsLoading(false);
        }, 1500);
    };

    if (hasError || !videoId) {
        // Fallback to purely the poster image if provided
        // But since we want to handle the transition gracefully, we might just stay in "loading" state if this component is used
        // However, if there is an error, we should probably render nothing (letting parent background show) 
        // OR render the poster permanently.
        if (poster) {
            return (
                <div
                    className={`absolute inset-0 bg-cover bg-center ${className}`}
                    style={{ backgroundImage: `url(${poster})` }}
                />
            );
        }
        return null;
    }

    return (
        <div className={`absolute inset-0 overflow-hidden ${className}`}>
            {/* Poster Layer - Always rendered, fades out when video is ready */}
            {poster && (
                <div
                    className={`absolute inset-0 bg-cover bg-center z-20 transition-opacity duration-1000 ease-in-out pointer-events-none ${isLoading ? 'opacity-100' : 'opacity-0'}`}
                    style={{ backgroundImage: `url(${poster})` }}
                />
            )}

            {/* Video Layer */}
            <div className={`absolute inset-0 transition-opacity duration-1000 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
                <iframe
                    ref={iframeRef}
                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&showinfo=0&modestbranding=1&playsinline=1&rel=0&enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
                    className="absolute w-[300%] h-[300%] top-[-100%] left-[-100%] pointer-events-none object-cover"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    onLoad={handleLoad}
                />
            </div>
        </div>
    );
}
