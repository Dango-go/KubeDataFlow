import React, { useRef, useState } from 'react';
import { ZoomIn, ZoomOut, Type } from 'lucide-react';

interface YamlCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  minHeight?: string;
  className?: string;
}

export const YamlCodeEditor: React.FC<YamlCodeEditorProps> = ({
  value,
  onChange,
  placeholder = "apiVersion: v1\nkind: ...",
  minHeight = "280px",
  className = ""
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const [fontSize, setFontSize] = useState<number>(12);

  const handleScroll = () => {
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.deltaY < 0) {
        setFontSize((prev) => Math.min(20, prev + 1));
      } else if (e.deltaY > 0) {
        setFontSize((prev) => Math.max(10, prev - 1));
      }
    }
  };

  const highlightYamlLine = (line: string, lineIndex: number): React.ReactNode => {
    if (line === '') {
      return <span key={lineIndex} className="block">&#8203;</span>;
    }

    // 1. Full line comment
    const trimmed = line.trimStart();
    if (trimmed.startsWith('#')) {
      const leadingSpaces = line.substring(0, line.length - trimmed.length);
      return (
        <span key={lineIndex} className="block">
          <span>{leadingSpaces}</span>
          <span className="text-slate-500 italic">{trimmed}</span>
        </span>
      );
    }

    // 2. Inline comment extraction
    let codePart = line;
    let commentPart = '';
    const commentIdx = line.indexOf(' #');
    if (commentIdx !== -1) {
      codePart = line.substring(0, commentIdx);
      commentPart = line.substring(commentIdx);
    }

    // 3. Parse key: value
    // Matches: [indent][- ][key]: [value]
    const keyValMatch = codePart.match(/^(\s*(?:-\s+)?)([\w\.\-\/]+)(\s*:\s*)(.*)$/);
    if (keyValMatch) {
      const [, prefix, key, colon, val] = keyValMatch;
      return (
        <span key={lineIndex} className="block">
          <span className="text-slate-400">{prefix}</span>
          <span className="text-sky-300 font-bold">{key}</span>
          <span className="text-slate-400 font-normal">{colon}</span>
          {formatYamlValue(val)}
          {commentPart && <span className="text-slate-500 italic">{commentPart}</span>}
        </span>
      );
    }

    // 4. List item without explicit key-value (e.g., - value)
    const listMatch = codePart.match(/^(\s*-\s+)(.*)$/);
    if (listMatch) {
      const [, prefix, val] = listMatch;
      return (
        <span key={lineIndex} className="block">
          <span className="text-sky-400 font-bold">{prefix}</span>
          {formatYamlValue(val)}
          {commentPart && <span className="text-slate-500 italic">{commentPart}</span>}
        </span>
      );
    }

    // Default line formatting
    return (
      <span key={lineIndex} className="block">
        {formatYamlValue(codePart)}
        {commentPart && <span className="text-slate-500 italic">{commentPart}</span>}
      </span>
    );
  };

  const formatYamlValue = (val: string): React.ReactNode => {
    if (!val) return null;
    const trimmed = val.trim();

    // Quoted strings: "...", '...'
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
      return <span className="text-amber-300 font-medium">{val}</span>;
    }

    // Booleans / null
    if (['true', 'false', 'null', 'yes', 'no'].includes(trimmed.toLowerCase())) {
      return <span className="text-purple-400 font-bold">{val}</span>;
    }

    // Numbers
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      return <span className="text-amber-400 font-semibold">{val}</span>;
    }

    // Default string / identifier value
    return <span className="text-emerald-300">{val}</span>;
  };

  const lines = value.split('\n');

  return (
    <div className={`group relative rounded-xl border border-slate-800 bg-brand-dark/95 overflow-hidden shadow-inner focus-within:ring-2 focus-within:ring-brand-sky focus-within:border-brand-sky ${className}`}>
      {/* Floating Font Size Zoom Toolbar */}
      <div className="absolute top-2.5 right-3 z-30 flex items-center gap-1 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-lg px-2 py-1 shadow-xl opacity-80 group-hover:opacity-100 focus-within:opacity-100 transition-all select-none">
        <button
          type="button"
          onClick={() => setFontSize((prev) => Math.max(10, prev - 1))}
          disabled={fontSize <= 10}
          title="Decrease font size (Ctrl + Scroll Down)"
          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-xs"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <span
          onClick={() => setFontSize(12)}
          title="Click to reset font size (12px)"
          className="text-[11px] font-mono font-bold text-brand-sky px-1 cursor-pointer hover:underline"
        >
          {fontSize}px
        </span>

        <button
          type="button"
          onClick={() => setFontSize((prev) => Math.min(22, prev + 1))}
          disabled={fontSize >= 22}
          title="Increase font size (Ctrl + Scroll Up)"
          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-xs"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Underlying Syntax Highlighted Pre/Code */}
      <pre
        ref={preRef}
        aria-hidden="true"
        style={{
          minHeight,
          fontSize: `${fontSize}px`,
          lineHeight: `${Math.round(fontSize * 1.6)}px`
        }}
        className="absolute inset-0 p-4 font-mono leading-relaxed overflow-hidden pointer-events-none whitespace-pre m-0 select-none z-0 overflow-y-auto overflow-x-auto"
      >
        <code>
          {value ? (
            lines.map((line, idx) => highlightYamlLine(line, idx))
          ) : (
            <span className="text-slate-600 italic">{placeholder}</span>
          )}
        </code>
      </pre>

      {/* Overlaid Interactive Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        onWheel={handleWheel}
        placeholder={placeholder}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        style={{
          minHeight,
          fontSize: `${fontSize}px`,
          lineHeight: `${Math.round(fontSize * 1.6)}px`
        }}
        className="relative z-10 w-full h-full p-4 font-mono leading-relaxed bg-transparent text-transparent caret-brand-sky focus:outline-none resize-y selection:bg-brand-sky/40 selection:text-white font-semibold m-0"
      />
    </div>
  );
};
