import { Check } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ColorOption {
  name: string;
  value: string;
  bgClass: string;
}

interface ColorSelectorProps {
  colors: ColorOption[];
  selectedColor: string;
  onColorSelect: (color: string) => void;
}

const ColorSelector = ({ colors, selectedColor, onColorSelect }: ColorSelectorProps) => {
  const { language } = useLanguage();
  
  const label = language === 'bg' ? 'Цвят' : 'Color';

  return (
    <div>
      <span className="font-heading font-semibold text-sm uppercase tracking-wide text-foreground mb-3 block">
        {label}: <span className="text-muted-foreground capitalize font-normal">{selectedColor}</span>
      </span>
      <div className="flex gap-3">
        {colors.map((color) => (
          <button
            key={color.value}
            onClick={() => onColorSelect(color.value)}
            className={`relative w-10 h-10 rounded-lg transition-all ${color.bgClass} ${
              selectedColor === color.value 
                ? "ring-2 ring-offset-2 ring-foreground scale-110" 
                : "hover:scale-105"
            }`}
            title={color.name}
          >
            {selectedColor === color.value && (
              <Check className={`absolute inset-0 m-auto w-5 h-5 ${
                color.value === 'blue' ? 'text-white' : 
                color.value === 'green' ? 'text-white' : 
                'text-white'
              }`} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ColorSelector;
