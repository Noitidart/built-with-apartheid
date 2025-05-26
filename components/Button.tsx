import classnames from 'classnames';
import { memo } from 'react';
import Spinner from './Spinner';

type TButtonProps = {
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
      base: 'bg-blue-600 text-white',
      hover: 'hover:bg-blue-700 disabled:hover:bg-blue-600',
      dark: 'dark:bg-blue-500 dark:hover:bg-blue-600 dark:disabled:hover:bg-blue-500'
    }
  };

  const currentColorClasses = colorClasses[props.color];

  return (
    <button
      type={props.type}
      onClick={props.onClick}
      disabled={isDisabled}
      className={classnames(
        // Base styles
        'font-medium transition-colors flex items-center justify-center disabled:opacity-70',
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
      {props.loading && <Spinner color="white" size="sm" className="mr-2" />}

      {props.label}
    </button>
  );
});

export default Button;
