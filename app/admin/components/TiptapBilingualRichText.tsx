'use client';

import { useEffect, useState } from 'react';
import { Typography, Space, Button } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';

interface TiptapBilingualRichTextProps {
    label: string;
    enValue: string | undefined;
    bgValue: string | undefined;
    onEnChange: (value: string) => void;
    onBgChange: (value: string) => void;
    placeholder?: string;
    showCopyButton?: boolean;
}

const MenuBar = ({ editor }: { editor: any }) => {
    if (!editor) return null;

    const buttonStyle = (isActive: boolean) => ({
        padding: '4px 8px',
        fontSize: '12px',
        border: '1px solid #d9d9d9',
        background: isActive ? '#e6f7ff' : '#fff',
        borderRadius: '4px',
        cursor: 'pointer',
        marginRight: '4px',
    });

    return (
        <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px',
            padding: '8px',
            background: '#fafafa',
            borderBottom: '1px solid #d9d9d9',
        }}>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBold().run()}
                style={buttonStyle(editor.isActive('bold'))}
                title="Bold"
            >
                <strong>B</strong>
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                style={buttonStyle(editor.isActive('italic'))}
                title="Italic"
            >
                <em>I</em>
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                style={buttonStyle(editor.isActive('underline'))}
                title="Underline"
            >
                <u>U</u>
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleStrike().run()}
                style={buttonStyle(editor.isActive('strike'))}
                title="Strike"
            >
                <s>S</s>
            </button>
            <span style={{ margin: '0 4px', borderLeft: '1px solid #d9d9d9' }} />
            <button
                type="button"
                onClick={() => editor.chain().focus().setParagraph().run()}
                style={buttonStyle(editor.isActive('paragraph'))}
                title="Paragraph"
            >
                P
            </button>
            {[1, 2, 3, 4, 5, 6].map((level) => (
                <button
                    key={level}
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 | 4 | 5 | 6 }).run()}
                    style={buttonStyle(editor.isActive('heading', { level }))}
                    title={`Heading ${level}`}
                >
                    H{level}
                </button>
            ))}
            <span style={{ margin: '0 4px', borderLeft: '1px solid #d9d9d9' }} />
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                style={buttonStyle(editor.isActive('bulletList'))}
                title="Bullet List"
            >
                • List
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                style={buttonStyle(editor.isActive('orderedList'))}
                title="Ordered List"
            >
                1. List
            </button>
            <span style={{ margin: '0 4px', borderLeft: '1px solid #d9d9d9' }} />
            <button
                type="button"
                onClick={() => {
                    const url = window.prompt('Enter URL');
                    if (url) {
                        editor.chain().focus().setLink({ href: url }).run();
                    }
                }}
                style={buttonStyle(editor.isActive('link'))}
                title="Link"
            >
                Link
            </button>
            <button
                type="button"
                onClick={() => {
                    const url = window.prompt('Enter image URL');
                    if (url) {
                        editor.chain().focus().setImage({ src: url }).run();
                    }
                }}
                style={buttonStyle(false)}
                title="Image"
            >
                Image
            </button>
            <span style={{ margin: '0 4px', borderLeft: '1px solid #d9d9d9' }} />
            <button
                type="button"
                onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                style={buttonStyle(false)}
                title="Insert Table"
            >
                Table
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
                style={buttonStyle(false)}
                title="Clear Formatting"
            >
                Clear
            </button>
        </div>
    );
};

const TiptapEditor = ({
    value,
    onChange,
}: {
    value: string | undefined;
    onChange: (value: string) => void;
}) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Link.configure({
                openOnClick: false,
            }),
            Image,
            Table.configure({
                resizable: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
        ],
        content: value || '',
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none focus:outline-none',
                style: 'min-height: 200px; padding: 12px;',
            },
        },
    });

    useEffect(() => {
        if (editor && value !== undefined && value !== editor.getHTML()) {
            editor.commands.setContent(value, false);
        }
    }, [editor, value]);

    if (!editor) return null;

    return (
        <div style={{ border: '1px solid #d9d9d9', borderRadius: 4, backgroundColor: '#fff' }}>
            <MenuBar editor={editor} />
            <EditorContent editor={editor} />
            <style>{`
                .ProseMirror:focus {
                    outline: none;
                }
                .ProseMirror p {
                    margin: 0.5em 0;
                }
                .ProseMirror h1, .ProseMirror h2, .ProseMirror h3, .ProseMirror h4, .ProseMirror h5, .ProseMirror h6 {
                    margin: 1em 0 0.5em;
                }
                .ProseMirror ul, .ProseMirror ol {
                    padding-left: 1.5em;
                }
                .ProseMirror table {
                    border-collapse: collapse;
                    width: 100%;
                    margin: 1em 0;
                }
                .ProseMirror th, .ProseMirror td {
                    border: 1px solid #d9d9d9;
                    padding: 8px;
                    text-align: left;
                }
                .ProseMirror th {
                    background-color: #fafafa;
                    font-weight: bold;
                }
            `}</style>
        </div>
    );
};

const TiptapBilingualRichText: React.FC<TiptapBilingualRichTextProps> = ({
    label,
    enValue,
    bgValue,
    onEnChange,
    onBgChange,
    showCopyButton = true,
}) => {
    const [translating, setTranslating] = useState(false);

    const handleCopyFromEnglish = () => {
        if (enValue) {
            onBgChange(enValue);
        }
    };

    const handleTranslateText = async () => {
        if (!enValue) return;
        setTranslating(true);
        try {
            const res = await fetch('/api/admin/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: enValue, type: 'html' }),
            });
            const data = await res.json();
            if (data.translated) {
                onBgChange(data.translated);
            }
        } catch (e) {
            console.error('Translation failed', e);
        } finally {
            setTranslating(false);
        }
    };

    return (
        <Space direction="vertical" size={12} style={{ width: '100%', maxWidth: '80vw' }}>
            <div>
                <Typography.Text strong>{label} (English)</Typography.Text>
                <TiptapEditor value={enValue} onChange={onEnChange} />
            </div>

            <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography.Text strong>{label} (Bulgarian)</Typography.Text>
                <Space>
                    {showCopyButton && (
                        <>
                            <Button
                                size="small"
                                icon={<CopyOutlined />}
                                onClick={handleCopyFromEnglish}
                                disabled={!enValue}
                            >
                                Copy
                            </Button>
                            <Button
                                size="small"
                                type="primary"
                                ghost
                                loading={translating}
                                onClick={handleTranslateText}
                                disabled={!enValue}
                            >
                                Translate
                            </Button>
                        </>
                    )}
                </Space>
            </Space>
            <div>
                <div style={{ border: '1px solid #d9d9d9', borderRadius: 4, backgroundColor: '#fffbe6' }}>
                    <TiptapEditor value={bgValue} onChange={onBgChange} />
                </div>
            </div>
        </Space>
    );
};

export default TiptapBilingualRichText;
