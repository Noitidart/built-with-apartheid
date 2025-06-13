import { useCallback, useState } from 'react';

function useForceRender() {
  const [, setRenderCount] = useState(0);

  const forceRender = useCallback(
    function forceRenderByIncrementingRenderCountInState() {
      setRenderCount(function incrementRenderCountInState(currentRenderCount) {
        const nextRenderCount = currentRenderCount + 1;

        return nextRenderCount;
      });
    },
    []
  );

  return forceRender;
}

export default useForceRender;
