'use client';

import { Slider as AntSlider } from 'antd';
import { ConfigProvider } from 'antd';

interface SliderProps {
    defaultValue?: [number, number];
    min?: number;
    max?: number;
    step?: number;
    onAfterChange?: (value: number[]) => void;
    className?: string; // Accept className to be friendly
}

export function Slider({ defaultValue, min = 0, max = 5000, step = 10, onAfterChange }: SliderProps) {
    return (
        <ConfigProvider
            theme={{
                components: {
                    Slider: {
                        colorPrimary: 'black',
                        colorPrimaryBorder: 'black',
                        colorPrimaryBorderHover: 'black',
                        handleColor: 'black',
                        trackBg: 'black',
                        trackHoverBg: 'black',
                        railBg: '#e5e7eb',
                        handleSize: 10,
                        handleLineWidth: 2,
                    }
                }
            }}
        >
            <AntSlider
                range
                defaultValue={defaultValue}
                min={min}
                max={max}
                step={step}
                onAfterChange={(val) => onAfterChange?.(val as number[])}
            />
        </ConfigProvider>
    );
}
