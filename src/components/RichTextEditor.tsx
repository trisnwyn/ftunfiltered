"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";

const TEXT_COLORS = [
  { label: "Default", value: "#1A1512" },
  { label: "Earth", value: "#8B4543" },
  { label: "Warm", value: "#9E8E7A" },
  { label: "Forest", value: "#4A6741" },
  { label: "Ocean", value: "#3D5A80" },
  { label: "Plum", value: "#6B4C6E" },
];

interface RichTextEditorProps {
  content?: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

function ToolbarButton({
  active,
  onAction,
  children,
  title,
}: {
  active?: boolean;
  onAction: () => void;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onAction();
      }}
      title={title}
      className={`flex h-8 w-8 items-center justify-center rounded-sm text-sm transition-colors ${
        active
          ? "bg-earth text-cream-light"
          : "text-ink-light hover:bg-cream-dark hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="mx-1 h-5 w-px bg-border" />;
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder,
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      Color,
    ],
    content: "",
    editorProps: {
      attributes: {
        class:
          "min-h-[180px] max-w-none font-serif text-[15px] leading-relaxed text-ink/80 focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && content === "") {
      editor.commands.clearContent();
    }
  }, [editor, content]);

  if (!editor) return null;

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-dashed border-border pb-3 mb-3">
        {/* Text style */}
        <ToolbarButton
          active={editor.isActive("bold")}
          onAction={() => editor.chain().focus().toggleBold().run()}
          title="Bold (Ctrl+B)"
        >
          <span className="font-bold">B</span>
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("italic")}
          onAction={() => editor.chain().focus().toggleItalic().run()}
          title="Italic (Ctrl+I)"
        >
          <span className="italic font-serif">I</span>
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("underline")}
          onAction={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline (Ctrl+U)"
        >
          <span className="underline">U</span>
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("strike")}
          onAction={() => editor.chain().focus().toggleStrike().run()}
          title="Strikethrough"
        >
          <span className="line-through">S</span>
        </ToolbarButton>

        <ToolbarDivider />

        {/* Heading (block-level) */}
        <ToolbarButton
          active={editor.isActive("heading", { level: 2 })}
          onAction={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          title="Heading (toggles current line)"
        >
          <span className="text-xs font-bold">H</span>
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("blockquote")}
          onAction={() => editor.chain().focus().toggleBlockquote().run()}
          title="Quote"
        >
          <span className="text-base leading-none">&ldquo;</span>
        </ToolbarButton>

        <ToolbarDivider />

        {/* Alignment */}
        <ToolbarButton
          active={editor.isActive({ textAlign: "left" })}
          onAction={() => editor.chain().focus().setTextAlign("left").run()}
          title="Align left"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="15" y2="12" /><line x1="3" y1="18" x2="18" y2="18" />
          </svg>
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive({ textAlign: "center" })}
          onAction={() => editor.chain().focus().setTextAlign("center").run()}
          title="Align center"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" /><line x1="6" y1="12" x2="18" y2="12" /><line x1="4" y1="18" x2="20" y2="18" />
          </svg>
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive({ textAlign: "right" })}
          onAction={() => editor.chain().focus().setTextAlign("right").run()}
          title="Align right"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" /><line x1="9" y1="12" x2="21" y2="12" /><line x1="6" y1="18" x2="21" y2="18" />
          </svg>
        </ToolbarButton>

        <ToolbarDivider />

        {/* Colors */}
        <div className="flex items-center gap-1">
          {TEXT_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              title={c.label}
              onMouseDown={(e) => {
                e.preventDefault();
                editor.chain().focus().setColor(c.value).run();
              }}
              className={`h-5 w-5 rounded-full border transition-transform hover:scale-110 ${
                editor.isActive("textStyle", { color: c.value })
                  ? "border-ink scale-110 ring-1 ring-ink/20"
                  : "border-border"
              }`}
              style={{ backgroundColor: c.value }}
            />
          ))}
        </div>

        <ToolbarDivider />

        {/* Clear formatting */}
        <ToolbarButton
          onAction={() =>
            editor.chain().focus().unsetAllMarks().clearNodes().run()
          }
          title="Clear formatting"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 7h16" /><path d="m5 7 4.5 10.5" /><path d="m12 7-2 5" /><path d="m18 21-5-5" /><path d="m13 16 5 5" />
          </svg>
        </ToolbarButton>

        {/* Undo/Redo */}
        <ToolbarButton
          onAction={() => editor.chain().focus().undo().run()}
          title="Undo"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
          </svg>
        </ToolbarButton>
        <ToolbarButton
          onAction={() => editor.chain().focus().redo().run()}
          title="Redo"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 7v6h-6" /><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
          </svg>
        </ToolbarButton>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  );
}
