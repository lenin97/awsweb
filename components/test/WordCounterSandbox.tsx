"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function WordCounterSandbox() {
  const MAX_WORDS = 700;
  const [text, setText] = useState("");
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    const count = text.trim().split(/\s+/).filter(Boolean).length;
    setWordCount(count);
  }, [text]);

  return (
    <div className="mx-auto my-12 max-w-lg px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-4"
      >
        <Label htmlFor="sandboxTextarea" className="text-lg font-semibold">
          Your text input (max {MAX_WORDS} words)
        </Label>

        <Textarea
          id="sandboxTextarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste or type up to 700 words…"
          aria-label="Text input limited to 700 words"
          className="h-40 resize-none"
        />

        <motion.div
          key={wordCount > MAX_WORDS ? "exceeded" : "normal"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className={`text-sm ${wordCount > MAX_WORDS ? "text-red-600" : "text-gray-600"}`}
        >
          {wordCount} / {MAX_WORDS} words
        </motion.div>

        <Button className="w-full" disabled={wordCount === 0}>
          Submit (no action)
        </Button>
      </motion.div>
    </div>
  );
}
