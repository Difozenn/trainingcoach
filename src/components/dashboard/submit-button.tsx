"use client";

import { useFormStatus } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Check } from "lucide-react";

export function SubmitButton({ children = "Save" }: { children?: React.ReactNode }) {
  const { pending } = useFormStatus();
  const [saved, setSaved] = useState(false);
  const prevPending = useRef(false);

  useEffect(() => {
    // Detect transition from pending → not pending (save completed)
    if (prevPending.current && !pending) {
      setSaved(true);
      const timer = setTimeout(() => setSaved(false), 2000);
      return () => clearTimeout(timer);
    }
    prevPending.current = pending;
  }, [pending]);

  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Saving...
        </>
      ) : saved ? (
        <>
          <Check className="mr-2 h-4 w-4 text-emerald-500" />
          Saved
        </>
      ) : (
        children
      )}
    </Button>
  );
}
