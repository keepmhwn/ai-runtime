import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type RefObject,
} from "react";
import {
  calculateScaleRatio,
  isValidDimensions,
  isValidPoint,
  type Point,
  type Polygon,
  type BoundingBox,
  type ScaleRatio,
  type Dimensions,
} from "@ai-runtime/core";

export type {
  Point,
  Polygon,
  BoundingBox,
  ScaleRatio,
  Dimensions,
} from "@ai-runtime/core";

/**
 * Hook configuration options
 */
export interface UseImageDimensionScaleConfig {
  /**
   * React ref pointing to the image element
   */
  imageRef: RefObject<HTMLImageElement | null>;

  /**
   * Original image width in pixels (from AI provider or image metadata)
   */
  originalWidth: number;

  /**
   * Original image height in pixels (from AI provider or image metadata)
   */
  originalHeight: number;

  /**
   * Whether to automatically recalculate on window resize
   * @default true
   */
  observeResize?: boolean;

  /**
   * Debounce delay in milliseconds for resize events
   * @default 100
   */
  debounceDelay?: number;

  /**
   * Callback when scale ratio changes
   */
  onScaleChange?: (scaleRatio: ScaleRatio) => void;
}

/**
 * Hook return value
 */
export interface UseImageDimensionScaleReturn {
  /**
   * Transform a polygon from absolute to display coordinates
   */
  transformPolygon: (polygon: Polygon) => Polygon;

  /**
   * Transform a single point from absolute to display coordinates
   */
  transformPoint: (point: Point) => Point;

  /**
   * Transform a bounding box from absolute to display coordinates
   */
  transformBoundingBox: (bbox: BoundingBox) => BoundingBox;

  /**
   * Current scale ratio between original and displayed image
   */
  scaleRatio: ScaleRatio | null;

  /**
   * Current displayed image dimensions
   */
  displayDimensions: Dimensions | null;

  /**
   * Original image dimensions
   */
  originalDimensions: Dimensions;

  /**
   * Whether the hook is ready (image is loaded and dimensions are calculated)
   */
  isReady: boolean;

  /**
   * Manually recalculate dimensions and scale ratio
   * Useful when image size changes programmatically
   */
  recalculate: () => void;
}

function getDisplayedImageDimensions(
  img: HTMLImageElement | null,
): Dimensions | null {
  if (!img) return null;

  // Use getBoundingClientRect for accurate rendered size
  const rect = img.getBoundingClientRect();

  // Fallback to offsetWidth/Height if rect is zero
  const width = rect.width || img.offsetWidth;
  const height = rect.height || img.offsetHeight;

  if (width === 0 || height === 0) return null;

  return { width, height };
}

/**
 * Debounce utility function
 */
function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: number | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Transform coordinates from original image space to displayed image space
 *
 * This hook automatically handles:
 * - Image loading and dimension detection
 * - Responsive resizing via ResizeObserver
 * - Scale ratio calculation
 * - Coordinate transformation for points, polygons, and bounding boxes
 *
 * @param config - Configuration options
 * @returns Object with transformation functions and state
 */
export function useImageDimensionScale(
  config: UseImageDimensionScaleConfig,
): UseImageDimensionScaleReturn {
  const {
    imageRef,
    originalWidth,
    originalHeight,
    observeResize = true,
    debounceDelay = 100,
    onScaleChange,
  } = config;

  // State
  const [displayDimensions, setDisplayDimensions] = useState<Dimensions | null>(
    null,
  );
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  // Memoized original dimensions
  const originalDimensions = useMemo<Dimensions>(
    () => ({
      width: originalWidth,
      height: originalHeight,
    }),
    [originalWidth, originalHeight],
  );

  // Calculate scale ratio
  const scaleRatio = useMemo<ScaleRatio | null>(() => {
    if (!displayDimensions || !isValidDimensions(displayDimensions)) {
      return null;
    }

    if (!isValidDimensions(originalDimensions)) {
      console.warn(
        "[useImageDimensionScale] Invalid original dimensions:",
        originalDimensions,
      );
      return null;
    }

    return calculateScaleRatio(originalDimensions, displayDimensions);
  }, [originalDimensions, displayDimensions]);

  // Check if ready
  const isReady = useMemo(() => {
    return isImageLoaded && scaleRatio !== null && displayDimensions !== null;
  }, [isImageLoaded, scaleRatio, displayDimensions]);

  // Recalculate dimensions
  const recalculate = useCallback(() => {
    const img = imageRef.current;
    if (!img) {
      setDisplayDimensions(null);
      return;
    }

    const dimensions = getDisplayedImageDimensions(img);
    if (dimensions && isValidDimensions(dimensions)) {
      setDisplayDimensions(dimensions);
    }
  }, [imageRef]);

  // Effect: Notify on scale change
  useEffect(() => {
    if (scaleRatio && onScaleChange) {
      onScaleChange(scaleRatio);
    }
  }, [scaleRatio, onScaleChange]);

  // Effect: Handle image load and resize observation
  useEffect(() => {
    const img = imageRef.current;
    if (!img) return;

    // Handle image load
    const handleImageLoad = () => {
      setIsImageLoaded(true);
      recalculate();
    };

    // Check if image is already loaded
    if (img.complete && img.naturalWidth > 0) {
      handleImageLoad();
    } else {
      img.addEventListener("load", handleImageLoad);
    }

    // Setup ResizeObserver if enabled
    let resizeObserver: ResizeObserver | null = null;

    if (observeResize && typeof ResizeObserver !== "undefined") {
      const debouncedRecalculate = debounce(recalculate, debounceDelay);

      resizeObserver = new ResizeObserver(() => {
        debouncedRecalculate();
      });

      resizeObserver.observe(img);
    }

    return () => {
      img.removeEventListener("load", handleImageLoad);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [imageRef, observeResize, debounceDelay, recalculate]);

  // Transform point from absolute to display coordinates
  const transformPoint = useCallback(
    (point: Point): Point => {
      if (!scaleRatio) {
        console.warn(
          "[useImageDimensionScale] Scale ratio not ready, returning original point",
        );
        return point;
      }

      if (!isValidPoint(point)) {
        console.warn("[useImageDimensionScale] Invalid point:", point);
        return point;
      }

      return {
        x: point.x * scaleRatio.x,
        y: point.y * scaleRatio.y,
      };
    },
    [scaleRatio],
  );

  // Transform polygon from absolute to display coordinates
  const transformPolygon = useCallback(
    (polygon: Polygon): Polygon => {
      if (!scaleRatio) {
        console.warn(
          "[useImageDimensionScale] Scale ratio not ready, returning original polygon",
        );
        return polygon;
      }

      if (!Array.isArray(polygon) || polygon.length === 0) {
        console.warn("[useImageDimensionScale] Invalid polygon:", polygon);
        return polygon;
      }

      return polygon.map((point) => transformPoint(point));
    },
    [scaleRatio, transformPoint],
  );

  // Transform bounding box from absolute to display coordinates
  const transformBoundingBox = useCallback(
    (bbox: BoundingBox): BoundingBox => {
      if (!scaleRatio) {
        console.warn(
          "[useImageDimensionScale] Scale ratio not ready, returning original bbox",
        );
        return bbox;
      }

      return {
        x: bbox.x * scaleRatio.x,
        y: bbox.y * scaleRatio.y,
        width: bbox.width * scaleRatio.x,
        height: bbox.height * scaleRatio.y,
      };
    },
    [scaleRatio],
  );

  return useMemo(
    () => ({
      transformPolygon,
      transformPoint,
      transformBoundingBox,
      scaleRatio,
      displayDimensions,
      originalDimensions,
      isReady,
      recalculate,
    }),
    [
      transformPolygon,
      transformPoint,
      transformBoundingBox,
      scaleRatio,
      displayDimensions,
      originalDimensions,
      isReady,
      recalculate,
    ],
  );
}

export {
  CoordinateTransformUtils,
  isPoint,
  isPolygon,
  isBoundingBox,
  transformPoint,
  transformPolygon,
  transformBoundingBox,
} from "@ai-runtime/core";
