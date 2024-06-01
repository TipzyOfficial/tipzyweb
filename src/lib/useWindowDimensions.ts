import { useState, useEffect, useLayoutEffect } from 'react';
import { debounce } from 'lodash';

export default function useWindowDimensions() {

  const [size, setSize] = useState([0, 0]);

  useLayoutEffect(() => {
    function updateSize() {
      setSize([window.innerWidth, window.innerHeight]);
    }

    const debouncedUpdateSize = debounce(updateSize, 200); 

    window.addEventListener('resize', debouncedUpdateSize);
    updateSize();
    return () => window.removeEventListener('resize', debouncedUpdateSize);
  }, []);

  return {width: size[0], height: size[1]};
}