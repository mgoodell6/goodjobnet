import { useState } from 'react';

export default function MultiSelect({ name, options = [], value, defaultValue = [], size = 6, onChange, className = '', children }) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const selectedValues = isControlled ? value : internalValue;

  const updateSelection = (nextValue) => {
    if (!isControlled) setInternalValue(nextValue);
    onChange?.(nextValue);
  };

  const handleMouseDown = (event) => {
    const option = event.target.closest('option');
    if (!option) return;

    event.preventDefault();
    const nextValue = selectedValues.includes(option.value)
      ? selectedValues.filter(selectedValue => selectedValue !== option.value)
      : [...selectedValues, option.value];
    updateSelection(nextValue);
  };

  const handleKeyDown = (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const option = event.target.closest('option');
    if (!option) return;
    event.preventDefault();
    const nextValue = selectedValues.includes(option.value)
      ? selectedValues.filter(selectedValue => selectedValue !== option.value)
      : [...selectedValues, option.value];
    updateSelection(nextValue);
  };

  return (
    <select
      name={name}
      multiple
      size={size}
      value={selectedValues}
      onChange={() => {}}
      onMouseDown={handleMouseDown}
      onKeyDown={handleKeyDown}
      className={`multi-select ${className}`}
      aria-describedby={`${name}-selection-help`}
    >
      {children || options.map(option => {
        const optionValue = typeof option === 'string' ? option : option.value ?? option.props?.value;
        const optionLabel = typeof option === 'string' ? option : option.label ?? option.props?.children;
        return <option key={optionValue} value={optionValue}>{optionLabel}</option>;
      })}
    </select>
  );
}
