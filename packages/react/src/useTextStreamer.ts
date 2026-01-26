import { useCallback, useRef, useState } from "react";
import {
  TextStreamer,
  TextStreamerOptions,
  RAFScheduler,
} from "@ai-runtime/core";

export interface UseTextStreamerOptions extends Partial<TextStreamerOptions> {
  initialText?: string;
}

export function useTextStreamer(options?: UseTextStreamerOptions) {
  const { initialText, ...streamerOptions } = options ?? {};
  const [text, setText] = useState(initialText ?? "");

  const schedulerRef = useRef<RAFScheduler>(new RAFScheduler());
  const streamerRef = useRef<TextStreamer>(
    new TextStreamer((text) => setText((prev) => prev + text), {
      ...streamerOptions,
    }),
  );

  const enqueue = useCallback((chunk: string) => {
    streamerRef.current.enqueue(chunk);
    schedulerRef.current.schedule(streamerRef.current.tick);
  }, []);

  const reset = useCallback(() => {
    streamerRef.current?.reset();
    setText(initialText ?? "");
  }, [initialText]);

  const stop = useCallback(() => {
    schedulerRef.current?.cancel();
  }, []);

  return {
    text,
    enqueue,
    reset,
    stop,
  };
}
