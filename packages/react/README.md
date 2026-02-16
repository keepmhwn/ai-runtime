# @ai-runtime/react

A React Hooks library for seamlessly integrating AI capabilities into React applications with performance optimization.

## Overview

`@ai-runtime/react` is designed to solve performance issues and complexity that arise when implementing AI-related features on the client side.

## Installation

```bash
npm install @ai-runtime/react
```

or

```bash
pnpm add @ai-runtime/react
```

## Key Features

### Text Streaming (`useTextStream`)

Smoothly stream LLM responses to enhance user experience.

#### Options

```typescript
interface UseTextStreamOptions {
  initialText?: string; // Initial text (default: "")
  charsPerUpdate?: number; // Number of characters to display at once (default: 1)
  updateInterval?: number; // Update interval in milliseconds (default: 10)
}
```

#### Usage

```tsx
import { useTextStream } from "@ai-runtime/react";

function ChatComponent() {
  const { text, enqueue, reset } = useTextStream({
    charsPerUpdate: 1,
    updateInterval: 30,
  });

  const handleStream = async () => {
    reset();

    const response = await fetch("/api/chat");
    const reader = response.body?.getReader();

    while (true) {
      const { done, value } = await reader!.read();
      if (done) break;

      const chunk = new TextDecoder().decode(value);
      enqueue(chunk);
    }
  };

  return (
    <div>
      <p>{text}</p>
      <button onClick={handleStream}>Get AI Response</button>
    </div>
  );
}
```

### Vision Coordinate Transformation (`useImageDimensionScale`)

Transform AI vision coordinates (from models like GPT-4 Vision, Claude Vision) to match displayed image dimensions in the browser.

#### When to Use

AI vision APIs typically return coordinates based on the original image dimensions. However, images displayed in browsers are often scaled differently due to CSS or responsive design. This hook automatically handles the coordinate transformation.

#### Options

```typescript
interface UseImageDimensionScaleConfig {
  imageRef: RefObject<HTMLImageElement | null>; // React ref to the image element
  originalWidth: number; // Original image width (from AI provider)
  originalHeight: number; // Original image height (from AI provider)
  observeResize?: boolean; // Auto-recalculate on resize (default: true)
  debounceDelay?: number; // Resize debounce delay in ms (default: 100)
  onScaleChange?: (scaleRatio: ScaleRatio) => void; // Callback when scale changes
}
```

#### Usage

```tsx
import { useImageDimensionScale, type Polygon } from "@ai-runtime/react";
import { useRef } from "react";

function ImageAnnotation() {
  const imageRef = useRef<HTMLImageElement>(null);

  // Coordinates from AI vision API
  const aiDetection = {
    polygon: [
      { x: 100, y: 100 },
      { x: 200, y: 100 },
      { x: 200, y: 200 },
      { x: 100, y: 200 },
    ],
    originalWidth: 1920,
    originalHeight: 1080,
  };

  const { transformPolygon, isReady } = useImageDimensionScale({
    imageRef,
    originalWidth: aiDetection.originalWidth,
    originalHeight: aiDetection.originalHeight,
  });

  // Transform AI coordinates to display coordinates
  const displayPolygon = transformPolygon(aiDetection.polygon);

  return (
    <div style={{ position: "relative" }}>
      <img
        ref={imageRef}
        src="/image.jpg"
        alt="Analyzed"
        style={{ width: "100%", height: "auto" }}
      />
      {isReady && (
        <svg
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
        >
          <polygon
            points={displayPolygon.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="rgba(255, 0, 0, 0.3)"
            stroke="red"
            strokeWidth="2"
          />
        </svg>
      )}
    </div>
  );
}
```

#### Advanced Usage with Bounding Boxes

```tsx
import { useImageDimensionScale, type BoundingBox } from "@ai-runtime/react";

function ObjectDetection() {
  const imageRef = useRef<HTMLImageElement>(null);

  // Bounding box from AI (x, y, width, height)
  const aiBoundingBox: BoundingBox = {
    x: 150,
    y: 100,
    width: 300,
    height: 200,
  };

  const { transformBoundingBox, transformPoint, isReady, scaleRatio } =
    useImageDimensionScale({
      imageRef,
      originalWidth: 1920,
      originalHeight: 1080,
      onScaleChange: (ratio) => {
        console.log("Scale ratio changed:", ratio);
      },
    });

  const displayBBox = transformBoundingBox(aiBoundingBox);

  return (
    <div style={{ position: "relative" }}>
      <img
        ref={imageRef}
        src="/detection.jpg"
        alt="Object Detection"
        style={{ maxWidth: "100%" }}
      />
      {isReady && (
        <div
          style={{
            position: "absolute",
            left: displayBBox.x,
            top: displayBBox.y,
            width: displayBBox.width,
            height: displayBBox.height,
            border: "2px solid lime",
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
}
```

## License

ISC
