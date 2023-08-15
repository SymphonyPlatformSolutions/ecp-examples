import { routes, AppEntry } from '../../Data/routes';
import './LandingPage.scss';

export const LandingPage = () => {
  const goto = (path : string) => {
    window.location.href = path;
  };

  const AppTile = ({ label, path, component } : AppEntry) => (
    <div className="app-tile" data-enabled={!!component} onClick={() => goto(path)}>
      <h3>{ label }</h3>
      { !component && <h6>Coming Soon</h6>}
    </div>
  );

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
