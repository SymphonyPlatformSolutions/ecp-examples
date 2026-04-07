import { useNavigate } from 'react-router-dom';
import { routes, AppEntry } from '../../Data/routes';
import './LandingPage.scss';

export const LandingPage = () => {
  const navigate = useNavigate();

  const goto = (path: string, enabled: boolean) => {
    if (!enabled) {
      return;
    }

    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    navigate(normalizedPath);
  };

  const AppTile = ({ label, path, component, enabled } : AppEntry) => {
    const isEnabled = enabled ?? !!component;

    return (
      <div className="app-tile" data-enabled={isEnabled} onClick={() => goto(path, isEnabled)}>
        <h3>{ label }</h3>
        { !isEnabled && <h6>Coming Soon</h6>}
      </div>
    );
  };

  return (
    <>
      <div className="app-grid">
        { routes.map((app) => <AppTile key={app.label} {...app} />) }
      </div>
      <a
        target="_blank" rel="noreferrer"
        href="https://docs.google.com/document/d/1HKkfX1jKHpyQRfLz1ZG9cgYdrQcFobYFPZLxOUzavJY"
      >
        How to Demo Clever Deal 2.0
      </a>
    </>
  );
};
