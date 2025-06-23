export function useToasts() {
  const addToast = useAddToast();

  return { addToast };
}

function useAddToast() {
  const addToast = function addToast(inputs: {
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
  }) {
    // TODO: Implement
  };

  return addToast;
}
