'use client';

import { useEffect, useRef } from 'react';
import { Typography, Space, Button } from 'antd';
import { useQuill } from 'react-quilljs';
import { CopyOutlined } from '@ant-design/icons';

interface BilingualRichTextProps {
  label: string;
  enValue: string | undefined;
  bgValue: string | undefined;
  onEnChange: (value: string) => void;
  onBgChange: (value: string) => void;
  placeholder?: string;
  showCopyButton?: boolean;
}

const BilingualRichText: React.FC<BilingualRichTextProps> = ({
  label,
  enValue,
  bgValue,
  onEnChange,
  onBgChange,
  placeholder,
  showCopyButton = true,
}) => {
  const modules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ align: [] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ indent: '-1' }, { indent: '+1' }],
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      ['link', 'image', 'video'],
      ['clean'],
      ['table'], // Add table button to toolbar
    ],
    table: true, // Enable table module
  };

  const formats = [
    'bold', 'italic', 'underline', 'strike',
    'align', 'list', 'indent',
    'header',
    'link', 'image', 'video',
    'table' // Allow table format
  ];

  const { quill: enQuill, quillRef: enQuillRef } = useQuill({ modules, formats });
  const { quill: bgQuill, quillRef: bgQuillRef } = useQuill({ modules, formats });

  // Refs to track last emitted values to avoid loop
  // Initialize to null to ensure first render triggers update
  const lastEnValue = useRef<string | undefined>(undefined);
  const lastBgValue = useRef<string | undefined>(undefined);

  // English Quill editor setup
  useEffect(() => {
    if (enQuill) {
      if (enValue && enValue !== lastEnValue.current) {
        enQuill.clipboard.dangerouslyPasteHTML(enValue);
        lastEnValue.current = enValue;
      }

      const handler = () => {
        const html = enQuill.root.innerHTML;
        if (html !== lastEnValue.current) {
          lastEnValue.current = html;
          onEnChange(html);
        }
      };

      enQuill.on('text-change', handler);
      return () => {
        enQuill.off('text-change', handler);
      };
    }
  }, [enQuill, enValue, onEnChange]);

  // Bulgarian Quill editor setup
  useEffect(() => {
    if (bgQuill) {
      if (bgValue && bgValue !== lastBgValue.current) {
        bgQuill.clipboard.dangerouslyPasteHTML(bgValue);
        lastBgValue.current = bgValue;
      }

      const handler = () => {
        const html = bgQuill.root.innerHTML;
        if (html !== lastBgValue.current) {
          lastBgValue.current = html;
          onBgChange(html);
        }
      };

      bgQuill.on('text-change', handler);
      return () => {
        bgQuill.off('text-change', handler);
      };
    }
  }, [bgQuill, bgValue, onBgChange]);

  const handleCopyFromEnglish = () => {
    if (enQuill && bgQuill && enValue) {
      bgQuill.clipboard.dangerouslyPasteHTML(enValue);
      onBgChange(enValue); // Ensure state is updated
    }
  };

  return (
    <Space orientation="vertical" size={12} style={{ width: '100%', maxWidth: '80vw' }}>
      <div>
        <Typography.Text strong>{label} (English)</Typography.Text>
        <div style={{ border: '1px solid #d9d9d9', borderRadius: 4, backgroundColor: '#fff' }}>
          <div ref={enQuillRef} />
        </div>
      </div>

      <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography.Text strong>{label} (Bulgarian)</Typography.Text>
        {showCopyButton && (
          <Button
            size="small"
            icon={<CopyOutlined />}
            onClick={handleCopyFromEnglish}
            disabled={!enValue}
          >
            Copy from English
          </Button>
        )}
      </Space>
      <div>
        <div style={{ border: '1px solid #d9d9d9', borderRadius: 4, backgroundColor: '#fffbe6' }}>
          <div ref={bgQuillRef} />
        </div>
      </div>
    </Space>
  );
};

export default BilingualRichText;
