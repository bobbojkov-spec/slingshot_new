import { Input, Typography, Space, Button } from 'antd';
import { CopyOutlined } from '@ant-design/icons';

interface BilingualInputProps {
  label: string;
  enValue: string | undefined;
  bgValue: string | undefined;
  onEnChange: (value: string) => void;
  onBgChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  showCopyButton?: boolean;
}

const BilingualInput: React.FC<BilingualInputProps> = ({
  label,
  enValue,
  bgValue,
  onEnChange,
  onBgChange,
  placeholder,
  rows,
  showCopyButton = true,
}) => {
  const InputComponent = rows ? Input.TextArea : Input;

  const handleCopyFromEnglish = () => {
    if (enValue) {
      onBgChange(enValue);
    }
  };

  return (
    <Space orientation="vertical" size={4} style={{ width: '100%' }}>
      <Typography.Text strong>{label} (English)</Typography.Text>
      <InputComponent
        value={enValue ?? ''}
        onChange={(e) => onEnChange(e.target.value)}
        placeholder={placeholder ? `${placeholder} (English)` : 'Enter English text'}
        style={{ backgroundColor: '#fff' }}
        rows={rows}
      />

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
      <InputComponent
        value={bgValue ?? ''}
        onChange={(e) => onBgChange(e.target.value)}
        placeholder={placeholder ? `${placeholder} (Bulgarian)` : 'Enter Bulgarian text'}
        style={{ backgroundColor: '#fffbe6' }}
        rows={rows}
      />
    </Space>
  );
};

export default BilingualInput;
