import { Check } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

type ColorOption = {
  id?: string;
  value?: string;
  name?: string;
  name_en?: string;
  name_bg?: string;
  hex_color?: string;
  bgClass?: string;
  available?: boolean;
};

interface ColorSelectorProps {
  colors: ColorOption[];
  selectedColor: string;
  onColorSelect: (colorKey: string) => void;
}

const ColorSelector = ({ colors, selectedColor, onColorSelect }: ColorSelectorProps) => {
  const { language } = useLanguage();
  const label = language === 'bg' ? 'Цвят' : 'Color';

  const renderName = (color?: ColorOption) => {
    if (!color) {
      return '-';
    }
    if (language === 'bg') {
      return color.name_bg || color.name || color.name_en || color.value;
    }
    return color.name_en || color.name || color.name_bg || color.value;
  };

  const selectedColorOption = colors.find((c) => {
    const key = c.id ?? c.value;
    return key === selectedColor;
  });
  const labelValue = selectedColorOption ? renderName(selectedColorOption) : '-';

  return (
    <div>
      <span className="font-heading font-semibold text-sm uppercase tracking-wide text-foreground mb-3 block">
        {label}: <span className="text-muted-foreground capitalize font-normal">{labelValue}</span>
      </span>
      <div className="flex gap-3">
        {colors.map((color) => {
          const optionKey = color.id ?? color.value ?? color.name ?? Math.random().toString();
          const isSelected = optionKey === selectedColor;
          const isDisabled = color.available === false;

          const style = {
            backgroundColor: color.hex_color,
          };

          return (
            <button
              key={optionKey}
              onClick={() => !isDisabled && onColorSelect(optionKey)}
              disabled={isDisabled}
              className={`relative w-10 h-10 rounded-lg transition-all ${
                isSelected ? 'ring-2 ring-offset-2 ring-foreground scale-110' : 'hover:scale-105'
              } ${color.bgClass ?? ''}`}
              title={isDisabled ? 'Out of stock' : renderName(color)}
              style={!color.hex_color ? {} : style}
            >
              {isSelected && (
                <Check className="absolute inset-0 m-auto w-5 h-5 text-white" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ColorSelector;
