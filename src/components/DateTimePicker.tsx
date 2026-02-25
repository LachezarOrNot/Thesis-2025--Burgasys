import React, { useEffect, useState } from 'react';
import { Calendar, Clock, ArrowLeft, ArrowRight } from 'lucide-react';

interface DateTimePickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({ label, value, onChange, required }) => {
  const [open, setOpen] = useState(false);

  const parseValue = (val: string): Date | null => {
    if (!val) return null;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  };

  const formatForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const initialDate = parseValue(value) || new Date();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth()); // 0-11
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);

  useEffect(() => {
    const parsed = parseValue(value);
    if (parsed) {
      setSelectedDate(parsed);
      setViewYear(parsed.getFullYear());
      setViewMonth(parsed.getMonth());
    }
  }, [value]);

  const daysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const handleDayClick = (day: number) => {
    const next = new Date(selectedDate);
    next.setFullYear(viewYear);
    next.setMonth(viewMonth);
    next.setDate(day);
    setSelectedDate(next);
    onChange(formatForInput(next));
  };

  const handleTimeChange = (type: 'hour' | 'minute', val: string) => {
    const num = parseInt(val, 10);
    if (isNaN(num)) return;
    const next = new Date(selectedDate);
    if (type === 'hour') {
      if (num < 0 || num > 23) return;
      next.setHours(num);
    } else {
      if (num < 0 || num > 59) return;
      next.setMinutes(num);
    }
    setSelectedDate(next);
    onChange(formatForInput(next));
  };

  const goMonth = (direction: -1 | 1) => {
    let m = viewMonth + direction;
    let y = viewYear;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setViewMonth(m);
    setViewYear(y);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const weekDays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
  // getDay(): 0 (Sun) - 6 (Sat); we want Monday as first
  const startOffset = (firstDayOfMonth.getDay() + 6) % 7;
  const totalDays = daysInMonth(viewYear, viewMonth);

  const selectedForDisplay = parseValue(value);

  const displayValue = selectedForDisplay
    ? `${selectedForDisplay.toLocaleDateString()} ${selectedForDisplay.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })}`
    : 'Select date & time';

  return (
    <div className="space-y-2 relative">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-left focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      >
        <span className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-100">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className={selectedForDisplay ? '' : 'text-gray-400'}>{displayValue}</span>
        </span>
        <Clock className="w-4 h-4 text-gray-400" />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => goMonth(-1)}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ArrowLeft className="w-4 h-4 text-gray-500" />
            </button>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              {monthNames[viewMonth]} {viewYear}
            </div>
            <button
              type="button"
              onClick={() => goMonth(1)}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ArrowRight className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1 text-xs mb-3">
            {weekDays.map((d) => (
              <div
                key={d}
                className="text-center text-gray-400 dark:text-gray-500 font-medium py-1"
              >
                {d}
              </div>
            ))}
            {Array.from({ length: startOffset }).map((_, idx) => (
              <div key={`empty-${idx}`} />
            ))}
            {Array.from({ length: totalDays }).map((_, idx) => {
              const day = idx + 1;
              const isSelected =
                selectedForDisplay &&
                selectedForDisplay.getFullYear() === viewYear &&
                selectedForDisplay.getMonth() === viewMonth &&
                selectedForDisplay.getDate() === day;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDayClick(day)}
                  className={`w-8 h-8 flex items-center justify-center rounded-full text-xs
                    ${isSelected
                      ? 'bg-primary-500 text-white'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Time inputs */}
          <div className="flex items-center gap-3 border-t border-gray-200 dark:border-gray-700 pt-3 mt-2">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">Time</span>
              <input
                type="number"
                min={0}
                max={23}
                value={selectedDate.getHours().toString().padStart(2, '0')}
                onChange={(e) => handleTimeChange('hour', e.target.value)}
                className="w-14 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <span className="text-xs text-gray-500 dark:text-gray-400">:</span>
              <input
                type="number"
                min={0}
                max={59}
                step={5}
                value={selectedDate.getMinutes().toString().padStart(2, '0')}
                onChange={(e) => handleTimeChange('minute', e.target.value)}
                className="w-14 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary-500 text-white hover:bg-primary-600"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateTimePicker;

