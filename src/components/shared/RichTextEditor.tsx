"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect } from "react";
import { Tooltip } from "@arcediano/ux-library";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  label?: string;
  helperText?: string;
  tooltip?: string;
  placeholder?: string;
  minHeight?: string;
  disabled?: boolean;
}

export function RichTextEditor({
  value,
  onChange,
  label,
  helperText,
  tooltip,
  placeholder,
  minHeight,
  disabled,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: placeholder ?? "" }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [editor, value]);

  if (!editor) {
    return null;
  }

  return (
    <div>
      {label && (
        <div className="flex items-center gap-2 mb-1.5">
          <p className="text-sm font-medium text-origen-bosque">{label}</p>
          {tooltip && <Tooltip content={tooltip} />}
        </div>
      )}

      <div className="rounded-xl border border-border bg-surface-alt overflow-hidden transition-all focus-within:border-origen-pradera focus-within:ring-2 focus-within:ring-origen-pradera/20">
        {/* Toolbar */}
        <div className="flex items-center gap-1 border-b border-border px-2 py-1.5 bg-surface-alt">
          {/* Bold */}
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={disabled}
            className={
              editor.isActive("bold")
                ? "h-7 w-7 rounded-md bg-origen-pradera/15 text-origen-bosque font-semibold text-sm"
                : "h-7 w-7 rounded-md text-muted-foreground hover:text-origen-bosque hover:bg-origen-crema text-sm"
            }
            title="Bold"
          >
            B
          </button>

          {/* Italic */}
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={disabled}
            className={
              editor.isActive("italic")
                ? "h-7 w-7 rounded-md bg-origen-pradera/15 text-origen-bosque font-semibold text-sm"
                : "h-7 w-7 rounded-md text-muted-foreground hover:text-origen-bosque hover:bg-origen-crema text-sm"
            }
            title="Italic"
          >
            I
          </button>

          {/* Bullet List */}
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            disabled={disabled}
            className={
              editor.isActive("bulletList")
                ? "h-7 w-7 rounded-md bg-origen-pradera/15 text-origen-bosque font-semibold text-sm"
                : "h-7 w-7 rounded-md text-muted-foreground hover:text-origen-bosque hover:bg-origen-crema text-sm"
            }
            title="Bullet List"
          >
            UL
          </button>

          {/* Ordered List */}
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            disabled={disabled}
            className={
              editor.isActive("orderedList")
                ? "h-7 w-7 rounded-md bg-origen-pradera/15 text-origen-bosque font-semibold text-sm"
                : "h-7 w-7 rounded-md text-muted-foreground hover:text-origen-bosque hover:bg-origen-crema text-sm"
            }
            title="Ordered List"
          >
            OL
          </button>

          {/* Clear formatting */}
          <button
            onClick={() =>
              editor.chain().focus().clearNodes().unsetAllMarks().run()
            }
            disabled={disabled}
            className="h-7 w-7 rounded-md text-muted-foreground hover:text-origen-bosque hover:bg-origen-crema text-sm"
            title="Clear formatting"
          >
            X
          </button>
        </div>

        {/* Editor Content */}
        <div style={{ minHeight: minHeight ?? "100px" }}>
          <EditorContent
            editor={editor}
            className="[&_.ProseMirror]:outline-none [&_.ProseMirror]:px-3 [&_.ProseMirror]:py-2
              [&_.ProseMirror_strong]:font-semibold
              [&_.ProseMirror_em]:italic
              [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-4 [&_.ProseMirror_ul]:space-y-1
              [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-4
              [&_.ProseMirror_li]:leading-relaxed
              [&_.ProseMirror_p]:mb-2 [&_.ProseMirror_p:last-child]:mb-0
              [&_.ProseMirror_h2]:text-sm [&_.ProseMirror_h2]:font-semibold [&_.ProseMirror_h2]:mt-3 [&_.ProseMirror_h2]:mb-1
              [&_.ProseMirror_h3]:text-sm [&_.ProseMirror_h3]:font-medium [&_.ProseMirror_h3]:mt-2 [&_.ProseMirror_h3]:mb-1
              [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]
              [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground
              [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left
              [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none"
          />
        </div>
      </div>

      {helperText && (
        <p className="text-xs text-muted-foreground mt-1">{helperText}</p>
      )}
    </div>
  );
}
