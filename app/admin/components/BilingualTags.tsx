'use client';

import { Select, Typography, Space, Button } from 'antd';
import { CopyOutlined } from '@ant-design/icons';

interface BilingualTagsProps {
  label: string;
  enValue: string[] | undefined;
  bgValue: string[] | undefined;
  onEnChange: (value: string[]) => void;
  onBgChange: (value: string[]) => void;
  placeholder?: string;
  showCopyButton?: boolean;
}

const BilingualTags: React.FC<BilingualTagsProps> = ({
  label,
  enValue,
  bgValue,
  onEnChange,
  onBgChange,
  placeholder,
  showCopyButton = true,
}) => {
  const handleCopyFromEnglish = () => {
    if (enValue && enValue.length > 0) {
      onBgChange(enValue);
    }
  };

  return (
    <Space orientation="vertical" size={4} style={{ width: '100%' }}>
      <Typography.Text strong>{label} (English)</Typography.Text>
      <Select
        mode="tags"
        value={enValue || []}
        onChange={onEnChange}
        placeholder={placeholder ? `${placeholder} (English)` : 'Add tags'}
        style={{ width: '100%', backgroundColor: '#fff' }}
        tokenSeparators={[',']}
      />

      <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography.Text strong>{label} (Bulgarian)</Typography.Text>
        {showCopyButton && (
          <Button
            size="small"
            icon={<CopyOutlined />}
            onClick={handleCopyFromEnglish}
            disabled={!enValue || enValue.length === 0}
          >
            Copy from English
          </Button>
        )}
      </Space>
      <Select
        mode="tags"
        value={bgValue || []}
        onChange={onBgChange}
        placeholder={placeholder ? `${placeholder} (Bulgarian)` : 'Add tags'}
        style={{ width: '100%', backgroundColor: '#fffbe6' }}
        tokenSeparators={[',']}
      />
    </Space>
  );
};

export default BilingualTags;

