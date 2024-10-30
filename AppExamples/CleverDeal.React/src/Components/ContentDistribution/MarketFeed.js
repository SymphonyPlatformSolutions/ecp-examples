import React, { useState, useEffect } from 'react';

const MarketFeed = () => {
    // dynamic import of tailwind css so that other components are not affected
    require("./index.css"); 
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
                    setMessages(prevMessages => [...prevMessages, data]);
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

    return (
        <div>
            <table className="table-auto w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 mb-6">
                <thead className="text-sm text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr className="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700">
                        {messages.length > 0 && Object.keys(messages[0]).map((key) => (
                            <th className="px-2 py-4 font-medium text-gray-900 dark:text-white w-1/8" key={key}>{key}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-gray-800 p-4 rounded-lg shadow-lg mt-6 font-mono" >
                    {messages.map((message, index) => (
                        <tr className="bg-gray-800 p-4 justify-between font-mono" key={index}>
                            {Object.values(message).map((value, i) => (
                                <td classname="px-2 py-4 font-mono" key={i}>{JSON.stringify(value)}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default MarketFeed;