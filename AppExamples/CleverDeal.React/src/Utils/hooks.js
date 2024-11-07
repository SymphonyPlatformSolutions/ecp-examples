import scriptLoader from 'react-async-script-loader';
import { useEffect, useState } from "react";
import Loading from '../Components/Loading';

export const withTailwindCSS = (Component) => scriptLoader(['https://cdn.tailwindcss.com'])(({ isScriptLoaded, isScriptLoadSucceed }) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isScriptLoaded && isScriptLoadSucceed) {
      setReady(true);
    }
  }, [isScriptLoaded, isScriptLoadSucceed]);

  return ready
    ? <Component />
    : <div className="large-loading">
      <Loading animate={true} className="logo"></Loading>
    </div>;
});
