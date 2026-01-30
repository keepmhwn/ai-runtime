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

## License

ISC
