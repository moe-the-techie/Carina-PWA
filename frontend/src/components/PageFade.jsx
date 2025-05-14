// PageFade.jsx
import React, { useEffect, useState } from 'react';
import Fade from '@mui/material/Fade';

export default function PageFade({ children }) {
  const [inProp, setInProp] = useState(false);

  useEffect(() => {
    const timer = requestAnimationFrame(() => setInProp(true));
    return () => cancelAnimationFrame(timer);
  }, []);

  return (
    <Fade in={inProp} timeout={200}>
      <div className="flex flex-col">{children}</div>
    </Fade>
  );
}
