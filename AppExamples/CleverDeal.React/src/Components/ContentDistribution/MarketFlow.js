import { useEffect, useState } from 'react';
import { withTailwindCSS } from '../../Utils/hooks';

const MarketFlow = () => {
    // require("./index.css");
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        const socket = new WebSocket("wss://poc.symphonymarket.solutions/ws");

        socket.onopen = () => {
            console.log("WebSocket connection established");
        };

        socket.onmessage = (event) => {
            console.log(`[message] Data received from server: ${event.data}`);
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'fdc3.trade') { // Only add trade messages
                    setMessages(prevMessages => [data, ...prevMessages]);
                }
            } catch (e) {
                console.error('Invalid JSON:', event.data);
            }
        };

        socket.onerror = (error) => {
            console.error(`[error] WebSocket error: ${error.message}`);
        };

        socket.onclose = (event) => {
            if (event.wasClean) {
                console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
            } else {
                console.error('[close] Connection died');
            }
        };

        return () => {
            socket.close();
        };
    }, []);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const handleClick = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = messages.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <div className="bg-gray-800 p-4 rounded-lg shadow-lg mt-6">
            <div className="overflow-auto relative max-h-screen">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex gap-2">
                        {/* Other elements can go here */}
                    </div>
                    <div className={`rounded-md flex items-center py-0.5 px-2.5 border border-transparent text-sm transition-all shadow-sm ${messages.length > 0 ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                        <div className={`mx-auto block h-2 w-2 rounded-full ${messages.length > 0 ? 'bg-green-300' : 'bg-red-900'} mr-2`}></div>
                        {messages.length > 0 ? 'Online' : 'Offline'}
                    </div>
                </div>
                <table className="table-auto w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 mb-6">
                    <thead className="text-sm text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr className="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700">
                            <th className="px-2 py-4 font-medium text-gray-900 dark:text-white w-1/8">Time</th>
                            <th className="px-2 py-4 font-medium text-gray-900 dark:text-white w-1/8">Instrument</th>
                            <th className="px-2 py-4 font-medium text-gray-900 dark:text-white w-1/8">Contract</th>
                            <th className="px-2 py-4 font-medium text-gray-900 dark:text-white w-1/8">PUT/CALL</th>
                            <th className="px-2 py-4 font-medium text-gray-900 dark:text-white w-1/8">Detail</th>
                            <th className="px-2 py-4 font-medium text-gray-900 dark:text-white w-2/8">Notes</th>
                        </tr>
                    </thead>
                    <tbody className="bg-gray-800 p-4 rounded-lg shadow-lg mt-6">
                        {currentItems.map((message, index) => (
                            <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600" key={index}>
                                <td className="px-2 py-4">{new Date().toLocaleString()}</td>
                                <td className="px-2 py-4">
                                    <span className="rounded-md bg-blue-600 py-0.5 px-2.5 border border-transparent text-sm text-white transition-all shadow-sm">
                                        {message.product.instrument.id.ticker}
                                    </span>
                                </td>
                                <td className="px-2 py-4">{message.product.id.productId}</td>
                                <td className="px-2 py-4">
                                    <span className={`text-sm px-2 py-1 rounded ${message.product.id.type === 'CALL' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                                        {message.product.id.type}
                                    </span>
                                </td>
                                <td className="px-2 py-4">{message.name}</td>
                                <td className="px-2 py-4">{message.id.notes}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <nav className="flex items-center flex-column flex-wrap md:flex-row justify-between pt-4" aria-label="Table navigation">
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400 mb-4 md:mb-0 block w-full md:inline md:w-auto">
                    Showing <span className="font-semibold text-gray-900 dark:text-white">{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, messages.length)}</span> of <span className="font-semibold text-gray-900 dark:text-white">{messages.length}</span>
                </span>
                <ul className="inline-flex -space-x-px rtl:space-x-reverse text-sm h-8">
                    <li>
                        <button
                            onClick={() => handleClick(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="flex items-center justify-center px-3 h-8 ms-0 leading-tight text-gray-500 bg-white border border-gray-300 rounded-s-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                        >
                            Previous
                        </button>
                    </li>
                    {[...Array(Math.ceil(messages.length / itemsPerPage)).keys()].map(number => (
                        <li key={number + 1}>
                            <button
                                onClick={() => handleClick(number + 1)}
                                className={`flex items-center justify-center px-3 h-8 leading-tight ${currentPage === number + 1 ? 'text-blue-600 border border-gray-300 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 dark:border-gray-700 dark:bg-gray-700 dark:text-white' : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'}`}
                            >
                                {number + 1}
                            </button>
                        </li>
                    ))}
                    <li>
                        <button
                            onClick={() => handleClick(currentPage + 1)}
                            disabled={currentPage === Math.ceil(messages.length / itemsPerPage)}
                            className="flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 rounded-e-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                        >
                            Next
                        </button>
                    </li>
                </ul>
            </nav>
        </div>
    );
};

export default withTailwindCSS(MarketFlow);
