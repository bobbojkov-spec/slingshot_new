import { useState } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

import { useSignedImages } from "@/hooks/useSignedImages";

const ProductGallery = ({ images, productName }: ProductGalleryProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const { urls, loading } = useSignedImages(images);

  const getSignedUrl = (path: string) => urls[path] || path;

  // Calculate resolved images or keep paths if loading/failed (fallback logic handled in hook result or here)
  // If loading, we could show skeletons, but for gallery let's fallback until loaded.

  const currentImage = getSignedUrl(images[selectedIndex]);

  const goToPrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") goToPrevious();
    if (e.key === "ArrowRight") goToNext();
    if (e.key === "Escape") setIsZoomOpen(false);
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Main Image */}
        <div
          className="relative bg-secondary/30 rounded-lg p-4 md:p-8 flex items-center justify-center cursor-zoom-in group"
          onClick={() => setIsZoomOpen(true)}
        >
          {loading ? (
            <div className="max-h-[400px] w-full h-[400px] bg-gray-100 animate-pulse rounded-lg" />
          ) : (
            <img
              src={currentImage}
              alt={`${productName} - Image ${selectedIndex + 1}`}
              className="max-h-[400px] md:max-h-[500px] object-contain transition-transform duration-300"
            />
          )}

          {/* Zoom hint - desktop/tablet only */}
          <div className="hidden md:flex absolute bottom-4 right-4 items-center gap-2 bg-background/80 backdrop-blur-sm px-3 py-2 rounded-full text-sm text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            <ZoomIn className="w-4 h-4" />
            <span>Click to zoom</span>
          </div>
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedIndex(index)}
                className={`relative flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all ${selectedIndex === index
                    ? "border-accent ring-2 ring-accent/30"
                    : "border-border hover:border-primary"
                  }`}
              >
                {loading ? (
                  <div className="w-full h-full bg-gray-100 animate-pulse" />
                ) : (
                  <img
                    src={getSignedUrl(image)}
                    alt={`${productName} thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Zoom Modal - Desktop/Tablet only */}
      <Dialog open={isZoomOpen} onOpenChange={setIsZoomOpen}>
        <DialogContent
          className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 bg-black/95 border-none"
          onKeyDown={handleKeyDown}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close button */}
            <button
              onClick={() => setIsZoomOpen(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {/* Navigation arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  className="absolute left-4 z-10 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                >
                  <ChevronLeft className="w-8 h-8 text-white" />
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-4 z-10 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                >
                  <ChevronRight className="w-8 h-8 text-white" />
                </button>
              </>
            )}

            {/* Zoomed image */}
            <img
              src={currentImage}
              alt={`${productName} - Image ${selectedIndex + 1}`}
              className="max-w-full max-h-full object-contain p-8"
            />

            {/* Image counter */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm">
                {selectedIndex + 1} / {images.length}
              </div>
            )}

            {/* Thumbnail strip at bottom */}
            {images.length > 1 && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedIndex(index)}
                    className={`w-12 h-12 rounded overflow-hidden border-2 transition-all ${selectedIndex === index
                        ? "border-white opacity-100"
                        : "border-transparent opacity-50 hover:opacity-75"
                      }`}
                  >
                    <img
                      src={getSignedUrl(image)}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductGallery;

