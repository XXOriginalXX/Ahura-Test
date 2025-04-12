
import React from 'react';
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TimeframeOption {
  value: string;
  label: string;
  interval: string;
}

interface TimeframeSelectorProps {
  timeframe: string;
  onTimeframeChange: (timeframe: string) => void;
  timeframeOptions: TimeframeOption[];
}

const TimeframeSelector: React.FC<TimeframeSelectorProps> = ({
  timeframe,
  onTimeframeChange,
  timeframeOptions
}) => {
  // Find the current timeframe label
  const currentTimeframe = timeframeOptions.find(option => option.value === timeframe);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center px-4 py-2 text-sm rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors">
          <span>{currentTimeframe?.label || "Timeframe"}</span>
          <ChevronDown className="w-4 h-4 ml-2" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-40">
        <DropdownMenuGroup>
          {timeframeOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              className={`cursor-pointer ${timeframe === option.value ? 'bg-muted' : ''}`}
              onClick={() => onTimeframeChange(option.value)}
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TimeframeSelector;
