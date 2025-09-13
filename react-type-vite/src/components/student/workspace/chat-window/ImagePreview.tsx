import { useState, useEffect } from "react";
import { X, RotateCw } from "lucide-react";

interface ImagePreviewProps {
  imageUrl: string;
  imageName?: string;
  isVisible: boolean;
  onClose: () => void;
  onImageLoaded?: () => void;
}

const ImagePreview = ({
  imageUrl,
  isVisible,
  onClose,
  onImageLoaded,
}: ImagePreviewProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsLoading(true);
      setHasError(false);
    }
  }, [isVisible, imageUrl]);

  const handleImageLoad = () => {
    setIsLoading(false);
    if (onImageLoaded) {
      onImageLoaded();
    }
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 bg-opacity-75 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="relative max-w-4xl max-h-full p-4">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-opacity-50 rounded-full hover:bg-opacity-75 transition-colors"
          aria-label="Close preview"
        >
          <X size={20} style={{ color: "black" }} />
        </button>

        {/* Loading spinner with rotation effect */}
        {isLoading && !hasError && (
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="text-center">
              <RotateCw
                size={48}
                className="text-white animate-spin mx-auto mb-4"
              />
              <p className="text-white text-lg">Loading image...</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {hasError && (
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="text-center text-white">
              <p className="text-lg mb-2">Failed to load image</p>
              <p className="text-sm text-gray-300">
                The image might be unavailable or corrupted
              </p>
            </div>
          </div>
        )}

        {/* Image */}
        <img
          src={imageUrl}
          onLoad={handleImageLoad}
          onError={handleImageError}
          className={`max-w-full max-h-full object-contain rounded-lg transition-opacity duration-300 ${
            isLoading ? "opacity-0" : "opacity-100"
          }`}
          style={{ display: hasError ? "none" : "block" }}
        />
      </div>
    </div>
  );
};

export default ImagePreview;
