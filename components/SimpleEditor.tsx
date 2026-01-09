'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { sanitizeLimitedHtml } from '@/lib/sanitizeLimitedHtml';

interface SimpleEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    rows?: number;
}

export default function SimpleEditor({ value, onChange, placeholder, rows = 4 }: SimpleEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const lastHtmlRef = useRef<string>('');
    const [focused, setFocused] = useState(false);

    const sanitizedValue = useMemo(() => sanitizeLimitedHtml(value || ''), [value]);

    // Keep editor in sync with external value (without clobbering selection on every keystroke)
    useEffect(() => {
        if (!editorRef.current) return;
        if (focused) return;
        if (sanitizedValue === lastHtmlRef.current) return;
        editorRef.current.innerHTML = sanitizedValue;
        lastHtmlRef.current = sanitizedValue;
    }, [sanitizedValue, focused]);

    const emitChange = () => {
        const el = editorRef.current;
        if (!el) return;
        const raw = el.innerHTML || '';
        const cleaned = sanitizeLimitedHtml(raw);
        if (cleaned !== raw) {
            el.innerHTML = cleaned;
            placeCaretAtEnd(el);
        }
        lastHtmlRef.current = cleaned;
        onChange(cleaned);
    };

    const exec = (cmd: 'bold' | 'italic') => {
        if (!editorRef.current) return;
        editorRef.current.focus();
        // eslint-disable-next-line deprecation/deprecation
        document.execCommand(cmd, false);
        emitChange();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        // Normalize Enter to <br> instead of <div>/<p>
        if (e.key === 'Enter') {
            e.preventDefault();
            // eslint-disable-next-line deprecation/deprecation
            document.execCommand('insertLineBreak');
            emitChange();
        }
    };

    const heightPx = Math.max(80, rows * 22);

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
                    onClick={() => exec('bold')}
                    style={{
                        padding: '4px 12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        border: '1px solid #d9d9d9',
                        background: '#fff',
                        borderRadius: '4px',
                        cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                    title="Bold"
                >
                    <strong>B</strong>
                </button>
                <button
                    type="button"
                    onClick={() => exec('italic')}
                    style={{
                        padding: '4px 12px',
                        fontSize: '12px',
                        fontStyle: 'italic',
                        border: '1px solid #d9d9d9',
                        background: '#fff',
                        borderRadius: '4px',
                        cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                    title="Italic"
                >
                    <em>I</em>
                </button>
            </div>

            {/* Editor */}
            <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onFocus={() => setFocused(true)}
                onBlur={() => {
                    setFocused(false);
                    emitChange();
                }}
                onInput={emitChange}
                onKeyDown={handleKeyDown}
                style={{
                    width: '100%',
                    padding: '12px',
                    outline: 'none',
                    overflow: 'auto',
                    fontSize: '14px',
                    minHeight: `${heightPx}px`,
                    whiteSpace: 'pre-wrap',
                    lineHeight: '1.5',
                }}
                data-placeholder={placeholder || ''}
            />

            {/* Placeholder styling */}
            <style dangerouslySetInnerHTML={{
                __html: `
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
        }
      `}} />
        </div>
    );
}

function placeCaretAtEnd(el: HTMLElement) {
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    if (!sel) return;
    sel.removeAllRanges();
    sel.addRange(range);
}
