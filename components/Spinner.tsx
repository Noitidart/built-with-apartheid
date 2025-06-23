import classnames from 'classnames';
import { memo } from 'react';

type TSpinnerProps = {
  size?: 'sm' | 'md' | 'lg';
  color?: 'white' | 'currentColor' | 'blue' | 'black';
  className?: string;
};

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-16 w-16'
};

const colorClasses = {
  white: 'text-white',
  currentColor: 'text-current',
  blue: 'text-blue-500',
  black: 'text-gray-700 dark:text-gray-300'
};

const Spinner = memo(function Spinner(initialProps: TSpinnerProps) {
  const props = {
    ...initialProps,
    size: initialProps.size ?? 'md',
    color: initialProps.color ?? 'currentColor'
  };

  return (
    <svg
      className={classnames(
        'animate-spin',
        sizeClasses[props.size],
        colorClasses[props.color],
        props.className
      )}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
});

export default Spinner;
