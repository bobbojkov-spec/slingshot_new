'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';

interface TiptapEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    rows?: number;
}

export default function TiptapEditor({ value, onChange, placeholder, rows = 4 }: TiptapEditorProps) {
    const heightPx = Math.max(80, rows * 22);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: false,
                bulletList: false,
                orderedList: false,
                blockquote: false,
                codeBlock: false,
                horizontalRule: false,
            }),
        ],
        content: value || '',
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none focus:outline-none',
                style: `min-height: ${heightPx}px;`,
            },
        },
    });

    // Sync external value with editor
    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value || '', false);
        }
    }, [editor, value]);

    if (!editor) {
        return null;
    }

    return (
        <div style={{ border: '1px solid #d9d9d9', borderRadius: '6px' }}>
            {/* Toolbar */}
            <div style={{
                display: 'flex',
                gap: '8px',
                padding: '8px',
                background: '#fafafa',
                borderBottom: '1px solid #d9d9d9',
            }}>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    disabled={!editor.can().chain().focus().toggleBold().run()}
                    style={{
                        padding: '4px 12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        border: '1px solid #d9d9d9',
                        background: editor.isActive('bold') ? '#e6f7ff' : '#fff',
                        borderRadius: '4px',
                        cursor: 'pointer',
                    }}
                    title="Bold"
                >
                    <strong>B</strong>
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    disabled={!editor.can().chain().focus().toggleItalic().run()}
                    style={{
                        padding: '4px 12px',
                        fontSize: '12px',
                        fontStyle: 'italic',
                        border: '1px solid #d9d9d9',
                        background: editor.isActive('italic') ? '#e6f7ff' : '#fff',
                        borderRadius: '4px',
                        cursor: 'pointer',
                    }}
                    title="Italic"
                >
                    <em>I</em>
                </button>
            </div>

            {/* Editor */}
            <div style={{ padding: '12px' }}>
                <EditorContent editor={editor} />
            </div>

            {/* Placeholder styling */}
            <style>{`
                .ProseMirror p.is-editor-empty:first-child::before {
                    content: attr(data-placeholder);
                    float: left;
                    color: #9ca3af;
                    pointer-events: none;
                    height: 0;
                }
                .ProseMirror:focus {
                    outline: none;
                }
                .ProseMirror p {
                    margin: 0;
                    line-height: 1.5;
                }
            `}</style>
        </div>
    );
}
