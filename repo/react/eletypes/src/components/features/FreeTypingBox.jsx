import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useLocale } from "../../context/LocaleContext";
import useSound from "use-sound";
import { SOUND_MAP } from "./sound/sound";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

const ASCII_FULL = [
  "```",
  "███████╗██╗     ███████╗    ████████╗██╗   ██╗██████╗ ███████╗███████╗",
  "██╔════╝██║     ██╔════╝    ╚══██╔══╝╚██╗ ██╔╝██╔══██╗██╔════╝██╔════╝",
  "█████╗  ██║     █████╗         ██║    ╚████╔╝ ██████╔╝█████╗  ███████╗",
  "██╔══╝  ██║     ██╔══╝         ██║     ╚██╔╝  ██╔═══╝ ██╔══╝  ╚════██║",
  "███████╗███████╗███████╗       ██║      ██║   ██║     ███████╗███████║",
  "╚══════╝╚══════╝╚══════╝       ╚═╝      ╚═╝   ╚═╝     ╚══════╝╚══════╝",
  "```",
].join("\n");

const ASCII_COMPACT = [
  "```",
  "╔═══════════════════╗",
  "║  E L E  T Y P E S  ║",
  "╚═══════════════════╝",
  "```",
].join("\n");

const BODY = `

# Start typing...

Write in **markdown** and see the preview on the right.

- Lists work
- So do \`inline code\`
- And [links](https://eletypes.com)

> Blockquotes too.

\`\`\`typescript
const greet = (name: string): void => {
  console.log(\`Hello, \${name}!\`);
};

greet("World");
\`\`\`

Just type. No pressure. It's coffee time.`;

const VIEW_SPLIT = "split";
const VIEW_EDITOR = "editor";
const VIEW_PREVIEW = "preview";

const FreeTypingBox = ({ spaces = 4, textAreaRef, soundMode, soundType }) => {
  const { t } = useLocale();
  const [text, setText] = useState({ value: "", caret: -1, target: null });
  const [viewMode, setViewMode] = useState(VIEW_SPLIT);

  const placeholder = useMemo(() => {
    const ascii = typeof window !== "undefined" && window.innerWidth <= 768 ? ASCII_COMPACT : ASCII_FULL;
    return ascii + BODY;
  }, []);

  const [play] = useSound(SOUND_MAP[soundType], { volume: 0.5 });

  // Auto-focus editor on mount
  useEffect(() => {
    if (textAreaRef?.current) textAreaRef.current.focus();
  }, [textAreaRef]);

  useEffect(() => {
    if (text.caret >= 0) {
      text.target.setSelectionRange(text.caret + spaces, text.caret + spaces);
    }
  }, [text, spaces]);

  const handleTab = useCallback((e) => {
    let content = e.target.value;
    let caret = e.target.selectionStart;

    if (e.key === "Tab") {
      e.preventDefault();
      let newText =
        content.substring(0, caret) +
        " ".repeat(spaces) +
        content.substring(caret);
      setText({ value: newText, caret: caret, target: e.target });
    }
  }, [spaces]);

  const handleText = useCallback((e) => {
    if (soundMode) {
      play();
    }
    setText({ value: e.target.value, caret: -1, target: e.target });
  }, [soundMode, play]);

  const handleSave = useCallback(() => {
    const content = text.value || placeholder;
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "eletypes-note.md";
    a.click();
    URL.revokeObjectURL(url);
  }, [text.value, placeholder]);

  const handleClear = useCallback(() => {
    setText({ value: "", caret: -1, target: null });
  }, []);

  const mdComponents = {
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || "");
      return !inline && match ? (
        <SyntaxHighlighter
          style={oneDark}
          language={match[1]}
          PreTag="div"
          customStyle={{ margin: "0.8em 0", borderRadius: "6px", fontSize: "0.85em" }}
          {...props}
        >
          {String(children).replace(/\n$/, "")}
        </SyntaxHighlighter>
      ) : (
        <code className={className} {...props}>{children}</code>
      );
    },
  };

  const markdownContent = text.value || placeholder;
  const showEditor = viewMode !== VIEW_PREVIEW;
  const showPreview = viewMode !== VIEW_EDITOR;

  return (
    <div className="novelty-container" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Toolbar */}
      <div className="md-toolbar">
        <div className="md-toolbar-group">
          <button
            className={`md-toolbar-btn ${viewMode === VIEW_EDITOR ? "md-toolbar-btn-active" : ""}`}
            onClick={() => setViewMode(VIEW_EDITOR)}
          >
            {t("md_editor")}
          </button>
          <button
            className={`md-toolbar-btn ${viewMode === VIEW_SPLIT ? "md-toolbar-btn-active" : ""}`}
            onClick={() => setViewMode(VIEW_SPLIT)}
          >
            {t("md_split")}
          </button>
          <button
            className={`md-toolbar-btn ${viewMode === VIEW_PREVIEW ? "md-toolbar-btn-active" : ""}`}
            onClick={() => setViewMode(VIEW_PREVIEW)}
          >
            {t("md_preview")}
          </button>
        </div>
        <div className="md-toolbar-group">
          <button className="md-toolbar-btn" onClick={handleSave}>
            {t("md_save")}
          </button>
          <button className="md-toolbar-btn" onClick={handleClear}>
            {t("md_clear")}
          </button>
        </div>
      </div>

      {/* Editor + Preview */}
      <div style={{
        display: "flex",
        gap: "0",
        flex: 1,
        minHeight: 0,
        width: "100%",
        borderRadius: "6px",
        overflow: "hidden",
      }}>
        {/* Editor pane */}
        {showEditor && (
          <div style={{ flex: 1, minWidth: 0, display: "flex" }}>
            <textarea
              onChange={handleText}
              onKeyDown={handleTab}
              value={text.value}
              ref={textAreaRef}
              className="textarea"
              spellCheck="false"
              placeholder={placeholder}
              style={{
                height: "100%",
                maxHeight: "100%",
                fontSize: viewMode === VIEW_EDITOR ? "20px" : "14px",
                fontFamily: "'Courier New', monospace",
                lineHeight: 1.7,
                padding: "20px 24px",
                borderRight: showPreview ? undefined : "none",
                overflow: "auto",
              }}
            />
          </div>
        )}

        {/* Divider */}
        {showEditor && showPreview && (
          <div className="md-divider" />
        )}

        {/* Preview pane */}
        {showPreview && (
          <div
            className="markdown-preview"
            style={{
              flex: 1,
              minWidth: 0,
              height: "100%",
              overflow: "auto",
              padding: "20px 28px",
              lineHeight: 1.8,
              fontSize: "15px",
            }}
          >
            <ReactMarkdown components={mdComponents}>{markdownContent}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};

export default FreeTypingBox;
