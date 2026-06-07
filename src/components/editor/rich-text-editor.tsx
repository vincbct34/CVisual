"use client";

import { useEditor, useEditorState, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect } from "react";
import dynamic from "next/dynamic";

const AIImproveButton = dynamic(
  () =>
    import("@/components/ai/ai-improve-button").then((m) => ({
      default: m.AIImproveButton,
    })),
  { ssr: false },
);

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  aiContext?: string;
}

export function RichTextEditor({
  content,
  onChange,
  placeholder,
  aiContext,
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
      }),
      Placeholder.configure({ placeholder: placeholder ?? "Écrivez ici..." }),
    ],
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html === "<p></p>" ? "" : html);
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none min-h-[60px] px-3 py-2",
      },
    },
  });

  useEffect(() => {
    if (
      editor &&
      content !== editor.getHTML() &&
      content !== (editor.getHTML() === "<p></p>" ? "" : editor.getHTML())
    ) {
      editor.commands.setContent(content || "");
    }
  }, [content, editor]);

  // Tiptap v3's useEditor no longer re-renders on every transaction, so
  // editor.isActive(...) read at render time goes stale. Subscribe to the
  // marks/nodes at the current selection so the toolbar reflects them.
  const state = useEditorState({
    editor,
    selector: ({ editor }) =>
      editor
        ? {
            isBold: editor.isActive("bold"),
            isItalic: editor.isActive("italic"),
            isBulletList: editor.isActive("bulletList"),
            isOrderedList: editor.isActive("orderedList"),
            canUndo: editor.can().undo(),
            canRedo: editor.can().redo(),
          }
        : null,
  });

  if (!editor) return null;

  // `state` is null until the first editor transaction; fall back to direct
  // reads so the toolbar is correct on mount too.
  const active = state ?? {
    isBold: editor.isActive("bold"),
    isItalic: editor.isActive("italic"),
    isBulletList: editor.isActive("bulletList"),
    isOrderedList: editor.isActive("orderedList"),
    canUndo: editor.can().undo(),
    canRedo: editor.can().redo(),
  };

  return (
    <div className="rte-container">
      {/* Toolbar */}
      <div className="rte-toolbar">
        <ToolbarButton
          active={active.isBold}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Gras"
        >
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton
          active={active.isItalic}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italique"
        >
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton
          active={active.isBulletList}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Liste à puces"
        >
          •
        </ToolbarButton>
        <ToolbarButton
          active={active.isOrderedList}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Liste numérotée"
        >
          1.
        </ToolbarButton>
        <div className="rte-divider" />
        <ToolbarButton
          active={false}
          disabled={!active.canUndo}
          onClick={() => editor.chain().focus().undo().run()}
          title="Annuler (Ctrl+Z)"
        >
          ↩
        </ToolbarButton>
        <ToolbarButton
          active={false}
          disabled={!active.canRedo}
          onClick={() => editor.chain().focus().redo().run()}
          title="Rétablir (Ctrl+Y)"
        >
          ↪
        </ToolbarButton>
        <div className="rte-divider" />
        <AIImproveButton
          content={content}
          context={aiContext}
          onAccept={(improved) => {
            editor.commands.setContent(improved);
            onChange(improved);
          }}
        />
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarButton({
  active,
  onClick,
  title,
  disabled,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`rte-toolbar-btn${active ? " active" : ""}`}
    >
      {children}
    </button>
  );
}
