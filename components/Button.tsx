import classnames from 'classnames';
import { memo } from 'react';
import Spinner from './Spinner';

export type TButtonProps = {
  label: React.ReactNode;

  /** (default: undefined) */
  onClick?: () => void;

  /** (default: "button") */
  type?: 'button' | 'submit' | 'reset';

  /** (default: false) */
  disabled?: boolean;

  /** (default: false) */
  loading?: boolean;

  /** (default: "blue") */
  color?: 'blue';

  /** (default: "lg") */
  size?: 'sm' | 'md' | 'lg';

  /** (default: false) */
  outlined?: boolean;

  /** (default: undefined) */
  className?: string;
};

const Button = memo(function Button(initialProps: TButtonProps) {
  const props = {
    ...initialProps,
    type: initialProps.type ?? 'button',
    color: initialProps.color ?? 'blue',
    size: initialProps.size ?? 'lg'
  };

  const isDisabled = props.disabled || props.loading;

  const sizeClasses = {
    sm: 'px-3 py-1 text-sm rounded',
    // Different text size on mobile
    md: 'px-4 py-2 text-sm sm:text-base rounded-lg',
    lg: 'px-6 py-3 rounded-lg'
  };

  const colorClasses = {
    blue: {
      filled: {
        base: 'bg-blue-600 text-white',
        hover: 'hover:bg-blue-700 disabled:hover:bg-blue-600',
        dark: 'dark:bg-blue-500 dark:hover:bg-blue-600 dark:disabled:hover:bg-blue-500'
      },
      outlined: {
        base: 'bg-transparent text-blue-600 border border-blue-600',
        hover: 'hover:bg-blue-50 disabled:hover:bg-transparent',
        dark: 'dark:text-blue-400 dark:border-blue-400 dark:hover:bg-blue-950 dark:disabled:hover:bg-transparent'
      }
    }
  };

  const fontWeightClasses = {
    filled: 'font-medium',
    outlined: 'font-normal'
  };

  const variant = props.outlined ? 'outlined' : 'filled';
  const currentColorClasses = colorClasses[props.color][variant];

  return (
    <button
      type={props.type}
      onClick={props.onClick}
      disabled={isDisabled}
      className={classnames(
        // Base styles
        'transition-colors flex items-center justify-center disabled:opacity-70',
        // Font Weight
        fontWeightClasses[variant],
        // Size
        sizeClasses[props.size],
        // Color
        currentColorClasses.base,
        currentColorClasses.hover,
        currentColorClasses.dark,
        // Custom className
        props.className
      )}
    >
      {props.loading && (
        <Spinner
          color={props.outlined ? 'blue' : 'white'}
          size="sm"
          className="mr-2"
        />
      )}

      {props.label}
    </button>
  );
});

export default Button;
