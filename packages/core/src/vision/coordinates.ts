/**
 * Point in 2D space with x,y coordinates
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Polygon represented as an array of points
 */
export type Polygon = Point[];

/**
 * Bounding box in various formats
 */
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Scale ratio between original and displayed image
 */
export interface ScaleRatio {
  x: number;
  y: number;
}

/**
 * Dimensions of an image or element
 */
export interface Dimensions {
  width: number;
  height: number;
}

/**
 * Calculate scale ratio between original and displayed dimensions
 */
export function calculateScaleRatio(
  original: Dimensions,
  displayed: Dimensions,
): ScaleRatio {
  return {
    x: displayed.width / original.width,
    y: displayed.height / original.height,
  };
}

/**
 * Validate that dimensions are valid
 */
export function isValidDimensions(
  dimensions: Dimensions | null,
): dimensions is Dimensions {
  return (
    dimensions !== null &&
    dimensions.width > 0 &&
    dimensions.height > 0 &&
    isFinite(dimensions.width) &&
    isFinite(dimensions.height)
  );
}

/**
 * Validate that a point has valid coordinates
 */
export function isValidPoint(point: Point): boolean {
  return (
    typeof point.x === "number" &&
    typeof point.y === "number" &&
    isFinite(point.x) &&
    isFinite(point.y)
  );
}

/**
 * Transform a point using a scale ratio
 */
export function transformPoint(point: Point, scaleRatio: ScaleRatio): Point {
  return {
    x: point.x * scaleRatio.x,
    y: point.y * scaleRatio.y,
  };
}

/**
 * Transform a polygon using a scale ratio
 */
export function transformPolygon(
  polygon: Polygon,
  scaleRatio: ScaleRatio,
): Polygon {
  return polygon.map((point) => transformPoint(point, scaleRatio));
}

/**
 * Transform a bounding box using a scale ratio
 */
export function transformBoundingBox(
  bbox: BoundingBox,
  scaleRatio: ScaleRatio,
): BoundingBox {
  return {
    x: bbox.x * scaleRatio.x,
    y: bbox.y * scaleRatio.y,
    width: bbox.width * scaleRatio.x,
    height: bbox.height * scaleRatio.y,
  };
}

/**
 * Check if a value is a valid Point
 */
export function isPoint(value: unknown): value is Point {
  return (
    typeof value === "object" &&
    value !== null &&
    "x" in value &&
    "y" in value &&
    typeof value.x === "number" &&
    typeof value.y === "number"
  );
}

/**
 * Check if a value is a valid Polygon
 */
export function isPolygon(value: unknown): value is Polygon {
  return Array.isArray(value) && value.length > 0 && value.every(isPoint);
}

/**
 * Check if a value is a valid BoundingBox
 */
export function isBoundingBox(value: unknown): value is BoundingBox {
  return (
    typeof value === "object" &&
    value !== null &&
    "x" in value &&
    "y" in value &&
    "width" in value &&
    "height" in value &&
    typeof value.x === "number" &&
    typeof value.y === "number" &&
    typeof value.width === "number" &&
    typeof value.height === "number"
  );
}

/**
 * Standalone utilities for coordinate transformation
 */
export const CoordinateTransformUtils = {
  calculateScaleRatio,
  transformPoint,
  transformPolygon,
  transformBoundingBox,
  isValidDimensions,
  isValidPoint,
};
