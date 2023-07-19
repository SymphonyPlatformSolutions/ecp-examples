import { useNavigate } from 'react-router-dom';
import { routes, AppEntry } from '../../Data/routes';
import './LandingPage.scss';

export const LandingPage = () => {
  const navigate = useNavigate();
  const AppTile = ({ label, path, component } : AppEntry) => (
    <div className="app-tile" data-enabled={!!component} onClick={() => path && navigate(path)}>
      <h3>{ label }</h3>
      { !component && <h6>Coming Soon</h6>}
    </div>
  );

  return (
    <div className="app-grid">
      { routes.map((app) => <AppTile key={app.label} {...app} />) }
    </div>
  );
};
