import React from 'react';
import { format } from 'date-fns';

interface DatePickerProps {
  selectedDate: string;
  onChange: (date: string) => void;
  className?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  selectedDate,
  onChange,
  className = ''
}) => {
  // Get current date at start of day
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Format today's date for min attribute
  const minDate = format(today, 'yyyy-MM-dd');

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = event.target.value;
    const selectedDateTime = new Date(newDate);
    selectedDateTime.setHours(0, 0, 0, 0);

    // Validate selected date is not in the past
    if (selectedDateTime < today) {
      alert('Please select today or a future date');
      return;
    }

    onChange(newDate);
  };

  return (
    <input
      type="date"
      value={selectedDate}
      min={minDate}
      onChange={handleDateChange}
      className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    />
  );
}; 