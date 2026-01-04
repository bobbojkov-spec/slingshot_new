'use client';

import { useEffect } from 'react';
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
  const { quill: enQuill, quillRef: enQuillRef } = useQuill();
  const { quill: bgQuill, quillRef: bgQuillRef } = useQuill();

  // English Quill editor setup
  useEffect(() => {
    if (enQuill) {
      enQuill.clipboard.dangerouslyPasteHTML(enValue || '');
      const handler = () => onEnChange(enQuill.root.innerHTML);
      enQuill.on('text-change', handler);
      return () => {
        enQuill.off('text-change', handler);
      };
    }
  }, [enQuill, onEnChange, enValue]); // Added enValue to dependencies for initial load

  // Bulgarian Quill editor setup
  useEffect(() => {
    if (bgQuill) {
      bgQuill.clipboard.dangerouslyPasteHTML(bgValue || '');
      const handler = () => onBgChange(bgQuill.root.innerHTML);
      bgQuill.on('text-change', handler);
      return () => {
        bgQuill.off('text-change', handler);
      };
    }
  }, [bgQuill, onBgChange, bgValue]); // Added bgValue to dependencies for initial load

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
