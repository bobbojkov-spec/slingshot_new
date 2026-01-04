'use client';

import { Select } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import { useLanguage } from './LanguageContext';

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage();

  return (
    <Select
      value={language}
      onChange={setLanguage}
      style={{ width: 140 }}
      size="small"
      options={[
        {
          value: 'en',
          label: (
            <span>
              🇬🇧 English
            </span>
          ),
        },
        {
          value: 'bg',
          label: (
            <span>
              🇧🇬 Bulgarian
            </span>
          ),
        },
      ]}
      suffixIcon={<GlobalOutlined />}
    />
  );
}

