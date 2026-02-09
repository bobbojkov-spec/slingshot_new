import { useState } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

interface ProductGalleryProps {
  images: string[];
  productName: string;
  activeIndex?: number;
}

const ProductGallery = ({ images, productName, activeIndex = 0 }: ProductGalleryProps) => {
  const [selectedIndex, setSelectedIndex] = useState(activeIndex);

  // Sync prop changes to state
  useState(() => {
    if (activeIndex !== undefined) setSelectedIndex(activeIndex);
  });
  // Actually better to use useEffect for updates
  const [prevActiveIndex, setPrevActiveIndex] = useState(activeIndex);
  if (activeIndex !== prevActiveIndex) {
    setSelectedIndex(activeIndex);
    setPrevActiveIndex(activeIndex);
  }

  const [isZoomOpen, setIsZoomOpen] = useState(false);

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
      <div className="flex flex-col gap-4 min-w-0">
        {/* Main Image */}
        <div
          className="relative bg-secondary/30 rounded flex items-center justify-center cursor-zoom-in group overflow-hidden"
          onClick={() => setIsZoomOpen(true)}
        >
          <img
            src={images[selectedIndex]}
            alt={`${productName} - Slingshot Bulgaria Official Image ${selectedIndex + 1}`}
            className="w-full h-auto object-cover transition-transform duration-300"
          />

          {/* Zoom hint - desktop/tablet only */}
          <div className="hidden md:flex absolute bottom-4 right-4 items-center gap-2 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full text-sm text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            <ZoomIn className="w-4 h-4" />
            <span>Click to zoom</span>
          </div>
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 flex-wrap max-w-full pb-2">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedIndex(index)}
                className={`relative w-14 h-14 md:w-20 md:h-20 rounded overflow-hidden border-2 transition-all ${selectedIndex === index
                  ? "border-accent ring-2 ring-accent/30"
                  : "border-border hover:border-primary"
                  }`}
              >
                <img
                  src={image}
                  alt={`${productName} - Slingshot Bulgaria Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Zoom Modal - Desktop/Tablet only */}
      <Dialog open={isZoomOpen} onOpenChange={setIsZoomOpen}>
        <DialogContent
          className="max-w-screen max-h-screen w-screen h-screen p-0 bg-black/95 border-none overflow-hidden"
          onKeyDown={handleKeyDown}
        >
          <DialogTitle className="sr-only">Product Image Zoom</DialogTitle>
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            {/* Close button */}
            <button
              onClick={() => setIsZoomOpen(false)}
              className="absolute top-6 right-6 z-[110] w-14 h-14 flex items-center justify-center bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full transition-all border border-white/20 shadow-2xl group"
            >
              <X className="w-8 h-8 text-white transition-transform group-hover:scale-110" />
            </button>

            {/* Navigation arrows */}
            {images.length > 0 && (
              <>
                <button
                  onClick={goToPrevious}
                  className="absolute left-6 z-[100] w-14 h-14 flex items-center justify-center bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full transition-all border border-white/10 group"
                >
                  <ChevronLeft className="w-9 h-9 text-white transition-transform group-hover:scale-110" />
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-6 z-[100] w-14 h-14 flex items-center justify-center bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full transition-all border border-white/10 group"
                >
                  <ChevronRight className="w-9 h-9 text-white transition-transform group-hover:scale-110" />
                </button>
              </>
            )}

            {/* Zoomed image */}
            <img
              src={images[selectedIndex]}
              alt={`${productName} - Slingshot Bulgaria Full View Image ${selectedIndex + 1}`}
              className="w-full h-full object-contain p-4 md:p-12 lg:p-24 selec-none pointer-events-none"
            />

            {/* Image counter */}
            {images.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-md border border-white/10 px-6 py-2 rounded-full text-white text-sm font-bold z-[100]">
                {selectedIndex + 1} / {images.length}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Thumbnail strip at bottom */}
      {images.length > 1 && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2 max-w-[90vw] overflow-x-auto px-2 py-1">
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
                src={image}
                alt={`${productName} - Slingshot Bulgaria Preview ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </>
  );
};

export default ProductGallery;

