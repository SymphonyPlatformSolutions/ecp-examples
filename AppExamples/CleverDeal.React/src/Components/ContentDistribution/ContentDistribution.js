import { Menu, Search, TrendingDown, TrendingUp } from 'lucide-react';
import { Link, Route, Routes, useLocation } from "react-router-dom";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import MarketFeed from './MarketFeed';
import MarketFlow from './MarketFlow';
import logo from './img/marketflow-logo.png';
import help_gif from './img/marketflow-help.gif';

import { withTailwindCSS } from '../../Utils/hooks';

const data = [
  { time: '19:00', value: 5458 },
  { time: '20:00', value: 5462 },
  { time: '21:00', value: 5470 },
  { time: '22:00', value: 5460 },
  { time: '23:00', value: 5468 },
];

const indices = [
  { name: 'S&P 500', value: 5464.61, change: -0.16, color: 'red', flag: '🇺🇸' },
  { name: 'Nasdaq 100', value: 19700.43, change: -0.26, color: 'red', flag: '🇺🇸' },
  { name: 'Dow 30', value: 39150.34, change: 0.04, color: 'green', flag: '🇺🇸' },
  { name: 'Nikkei 225', value: 38596.40, change: -0.09, color: 'red', flag: '🇯🇵' },
];

const watchlistItems = [
  { symbol: 'NIFTY', price: 23467, change: -0.53, color: 'red' },
  { symbol: 'BANKNIFTY', price: 51613.35, change: -0.27, color: 'red' },
  { symbol: 'SPX', price: 5464.61, change: -0.16, color: 'red' },
  { symbol: 'BTCUSD', price: 64444, change: 0.33, color: 'green' },
  { symbol: 'VIX', price: 13.2, change: -0.6, color: 'red' },
  { symbol: 'XAUUSD', price: 2321.875, change: -1.62, color: 'red' },
  { symbol: 'WTICOUS', price: 80.952, change: -0.83, color: 'red' },
  { symbol: 'USDJPY', price: 159.76, change: 0.54, color: 'green' },
];

const getNavItems = () => [
  { name: 'Home', path: '/content' },
  { name: 'Market Feed', path: '/content/feed' },
  { name: 'News', path: '/content/news' },
  { name: 'Brokers', path: '/content/brokers' },
  { name: 'Help', path: '/content/help' },
  { name: 'Clever Deal', path: '/' },
];

export const ContentDistribution = withTailwindCSS(() =>
  <div className="ContentDistribution">
    <Routes>
      <Route index element={<Home />} />
      <Route path="feed" element={<Feed />} />
      <Route path="news" element={<News />} />
      <Route path="brokers" element={<Brokers />} />
      <Route path="help" element={<Help />} />
      <Route path="*" element={<NoMatch />} />
    </Routes>
  </div>
);

function Home() {
  const location = useLocation();
  const navItems = getNavItems();

  return (
    <div className="bg-gray-900 text-white min-h-screen font-sans flex flex-col">
      <header className="bg-gray-800 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <img src={logo} alt="Market Flow Logo" className="w-14 h-14 rounded-lg" />
          <span className="text-2xl font-bold text-blue-500">Market Flow</span>
          <nav className="hidden md:flex space-x-6">
            {navItems.map((item) => (
              <button
                key={item.name}
                className={`text-gray-300 hover:text-blue-400 transition-colors duration-200 ${location.pathname === item.path ? 'font-bold text-blue-400' : ''}`}
                onClick={() => {
                  window.location.href = item.path;
                }}
              >
                {item.name}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input type="text" placeholder="Search" className="bg-gray-700 text-white rounded-full py-2 px-4 pl-10 w-40 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200" />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          </div>
          <button className="bg-blue-600 rounded-full p-2 hover:bg-blue-700 transition-colors duration-200">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-grow p-6 overflow-hidden flex">
        <div className="flex-grow mr-4">
          <h2 className="text-xl font-semibold mb-4 text-blue-400">Market Summary</h2>
          <div className="grid grid-cols-1 grid-rows-1 sm:grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
            {indices.map((index) => (
              <div key={index.name} className="bg-gray-800 p-4 rounded-lg shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400 flex items-center">
                    <span className="mr-2 text-lg">{index.flag}</span>
                    {index.name}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${index.color === 'green' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                    {index.change > 0 ? '+' : ''}{index.change}%
                  </span>
                </div>
                <div className="text-2xl font-bold">{index.value.toLocaleString()}</div>
              </div>
            ))}
          </div>

          <div className="bg-gray-800 p-4 rounded-lg shadow-lg h-64 sm:h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <XAxis dataKey="time" stroke="#6B7280" />
                <YAxis domain={['dataMin - 5', 'dataMax + 5']} stroke="#6B7280" />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
                <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* <div> */}
          <div className="flex-grow mr-4 space-y-2">
            <h2 className="text-xl font-semibold mt-4 mb-4 text-blue-400">Real Time Feed</h2>
            <MarketFlow />
          </div>
        </div>

        <aside className="w-64 bg-gray-800 p-4 rounded-lg overflow-y-auto">
          <h3 className="text-xl font-semibold mb-4 text-blue-400">Watchlist</h3>
          <ul className="space-y-2">
            {watchlistItems.map((item) => (
              <li key={item.symbol} className="flex justify-between items-center p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors duration-200">
                <div>
                  <span className="font-medium">{item.symbol}</span>
                  <span className="block text-sm text-gray-400">{item.price.toLocaleString()}</span>
                </div>
                <div className={`flex items-center ${item.color === 'green' ? 'text-green-400' : 'text-red-400'}`}>
                  {item.color === 'green' ? <TrendingUp size={16} className="mr-1" /> : <TrendingDown size={16} className="mr-1" />}
                  <span>{item.change > 0 ? '+' : ''}{item.change}%</span>
                </div>
              </li>
            ))}
          </ul>
        </aside>
      </main>
    </div>
  );
}

function Feed() {
  const location = useLocation();
  const navItems = getNavItems();

  return (
    <div className="bg-gray-900 text-white min-h-screen font-sans flex flex-col">
      <header className="bg-gray-800 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <img src={logo} alt="Market Flow Logo" className="w-14 h-14 rounded-lg" />
          <span className="text-2xl font-bold text-blue-500">Market Flow</span>
          <nav className="hidden md:flex space-x-6">
            {navItems.map((item) => (
              <button
                key={item.name}
                className={`text-gray-300 hover:text-blue-400 transition-colors duration-200 ${location.pathname === item.path ? 'font-bold text-blue-400' : ''}`}
                onClick={() => {
                  window.location.href = item.path;
                }}
              >
                {item.name}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input type="text" placeholder="Search" className="bg-gray-700 text-white rounded-full py-2 px-4 pl-10 w-40 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200" />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          </div>
          <button className="bg-blue-600 rounded-full p-2 hover:bg-blue-700 transition-colors duration-200">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>
      <span className="text-sm text-gray-400 flex items-center"></span>
      <p className="text-center text-2xl text-gray-400 mt-6">
        Market Feed
      </p>
      <div className="bg-gray-800 p-4 rounded-lg shadow-lg mt-6 font-mono">
        <MarketFeed />
      </div>
    </div>
  );
}

function News() {
  const location = useLocation();
  const navItems = getNavItems();

  return (
    <div className="bg-gray-900 text-white min-h-screen font-sans flex flex-col">
      <header className="bg-gray-800 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <img src={logo} alt="Market Flow Logo" className="w-14 h-14 rounded-lg" />
          <span className="text-2xl font-bold text-blue-500">Market Flow</span>
          <nav className="hidden md:flex space-x-6">
            {navItems.map((item) => (
              <button
                key={item.name}
                className={`text-gray-300 hover:text-blue-400 transition-colors duration-200 ${location.pathname === item.path ? 'text-blue-400' : ''}`}
                onClick={() => {
                  window.location.href = item.path;
                }}
              >
                {item.name}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input type="text" placeholder="Search" className="bg-gray-700 text-white rounded-full py-2 px-4 pl-10 w-40 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200" />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          </div>
          <button className="bg-blue-600 rounded-full p-2 hover:bg-blue-700 transition-colors duration-200">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>
      <span className="text-sm text-gray-400 flex items-center"></span>
      <p className="text-center text-2xl text-gray-400 mt-6">
        404 - Not Found
      </p>
      <p className="text-center text-2x1 text-gray-400 mt-6">
        Oops! The page you are looking for might have been removed.
      </p>
      <p className="text-center text-2x1 text-gray-400 mt-6">
        <Link to="/content">Let's go back to the Home page</Link>
      </p>
    </div>
  );
}

function Brokers() {
  const location = useLocation();
  const navItems = getNavItems();

  return (
    <div className="bg-gray-900 text-white min-h-screen font-sans flex flex-col">
      <header className="bg-gray-800 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <img src={logo} alt="Market Flow Logo" className="w-14 h-14 rounded-lg" />
          <span className="text-2xl font-bold text-blue-500">Market Flow</span>
          <nav className="hidden md:flex space-x-6">
            {navItems.map((item) => (
              <button
                key={item.name}
                className={`text-gray-300 hover:text-blue-400 transition-colors duration-200 ${location.pathname === item.path ? 'text-blue-400' : ''}`}
                onClick={() => {
                  window.location.href = item.path;
                }}
              >
                {item.name}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input type="text" placeholder="Search" className="bg-gray-700 text-white rounded-full py-2 px-4 pl-10 w-40 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200" />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          </div>
          <button className="bg-blue-600 rounded-full p-2 hover:bg-blue-700 transition-colors duration-200">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>
      <span className="text-sm text-gray-400 flex items-center"></span>
      <p className="text-center text-2xl text-gray-400 mt-6">
        404 - Not Found
      </p>
      <p className="text-center text-2x1 text-gray-400 mt-6">
        Oops! The page you are looking for might have been removed.
      </p>
      <p className="text-center text-2x1 text-gray-400 mt-6">
        <Link to="/content">Let's go back to the Home page</Link>
      </p>
    </div>
  );
}

function Help() {
  const location = useLocation();
  const navItems = getNavItems();

  return (
    <div className="bg-gray-900 text-white min-h-screen font-sans flex flex-col">
      <header className="bg-gray-800 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <img src={logo} alt="Market Flow Logo" className="w-14 h-14 rounded-lg" />
          <span className="text-2xl font-bold text-blue-500">Market Flow</span>
          <nav className="hidden md:flex space-x-6">
            {navItems.map((item) => (
              <button
                key={item.name}
                className={`text-gray-300 hover:text-blue-400 transition-colors duration-200 ${location.pathname === item.path ? 'text-blue-400' : ''}`}
                onClick={() => {
                  window.location.href = item.path;
                }}
              >
                {item.name}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input type="text" placeholder="Search" className="bg-gray-700 text-white rounded-full py-2 px-4 pl-10 w-40 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200" />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          </div>
          <button className="bg-blue-600 rounded-full p-2 hover:bg-blue-700 transition-colors duration-200">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>
      <main className="flex-grow p- overflow-hidden flex flex-col items-center">
      <p className="text-center text-2xl text-gray-400 mt-6">Help Page</p>
        <p className="text-lg text-center text-gray-400 mt-6">Here you can find help and support for using Market Flow.</p><br/>
        <img src={help_gif} alt="Market Flow Help" className="w-full max-w-3xl rounded-lg shadow-lg mb-6" />
        <div className="text-gray-400">
          <h2 className="text-2xl font-semibold mt-4">Frequently Asked Questions</h2>
          <h3 className="text-2xl font-semibold mt-4">What is Market Flow?</h3>
          <p className="text-lg mt-4">
            Market Flow is a demonstration of how you can leverage the Symphony network to distribute content.
            <br />Broadcast near real-time content directly into chat rooms via a Symphony chat bot.
            <br />The MarketFlow Bot publishes information for Symphony users and other bots to consume.
            <br />The Acme Bank Bot "listens" for this new content and then publishes this information to the Market Flow web portal.
            <br />
          </p>
          <br/>
          <h3 className="text-2xl font-semibold mt-4">How do I use Market Flow?</h3>
          <p className="text-lg mt-4 mb-4">
            Navigate to the <a href='https://open.symphony.com/?streamId=bBnbhkxXsoSbOrcWbLq5iH%2F%2F%2Fm1pEOVTdA%3D%3D&streamType=chatroom' target="_blank" rel="noreferrer" className="text-blue-500">Content Distribution Room</a> and invoke the Publishing bot using the command <b>@Market Flow Publish /publish</b>
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>You should start seeing information being published in the Content Distribution Room.</li>
            <li>View the members of the room, you will see two bots, the MarketFlow Bot and the Acme Bank Subscriber Bot.</li>
            <li>The Market Flow Publisher bot is broadcasting content to the Symphony chat room.</li>
            <li>The Acme Bank Subscriber Bot is listening for new content and then publishing this information to the Market Flow web portal.</li>
            <li>Navigate to the <Link to="/content" className="text-blue-500">Market Flow</Link> web portal to see the content being published.</li>
            <li>Navigate to the <Link to="/content/feed" className="text-blue-500">Market Feed</Link> page, here you can view the raw messages being sent in the Symphony chat room.</li>
            <li>Messages will stop publishing after a few minutes automatically.</li>
          </ul>
          <br/>
          <h3 className="text-2xl font-semibold mt-4">How can I contact support?</h3>
          <p className="text-lg mt-4">Reach out to the Symphony Partnership team </p>
          <br/>
          <h3 className="text-2xl font-semibold mt-4">Where can I find more information?</h3>
          <p className="text-lg mt-4">
            You can check out the presentation <a href='https://docs.google.com/presentation/d/1YNkD5HsVv5SWUUpU7eb-3qGZJeqT93bu0P3OzDBkzbU/edit?usp=sharing' target="_blank" rel="noreferrer" className="text-blue-500">here</a>
          </p>
        </div>
      </main>
    </div>
  );
}

function NoMatch() {
  const location = useLocation();
  const navItems = getNavItems();

  return (
    <div className="bg-gray-900 text-white min-h-screen font-sans flex flex-col">
      <header className="bg-gray-800 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <img src={logo} alt="Market Flow Logo" className="w-14 h-14 rounded-lg" />
          <span className="text-2xl font-bold text-blue-500">Market Flow</span>
          <nav className="hidden md:flex space-x-6">
            {navItems.map((item) => (
              <button
                key={item.name}
                className={`text-gray-300 hover:text-blue-400 transition-colors duration-200 ${location.pathname === item.path ? 'text-blue-400' : ''}`}
                onClick={() => {
                  window.location.href = item.path;
                }}
              >
                {item.name}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input type="text" placeholder="Search" className="bg-gray-700 text-white rounded-full py-2 px-4 pl-10 w-40 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200" />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          </div>
          <button className="bg-blue-600 rounded-full p-2 hover:bg-blue-700 transition-colors duration-200">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>
      <span className="text-sm text-gray-400 flex items-center"></span>
      <p className="text-center text-2xl text-gray-400 mt-6">
        404 - Not Found
      </p>
      <p className="text-center text-2x1 text-gray-400 mt-6">
        Oops! The page you are looking for might have been removed.
      </p>
      <p className="text-center text-2x1 text-gray-400 mt-6">
        <Link to="/content">Let's go back to the Home page</Link>
      </p>
    </div>
  );
}
