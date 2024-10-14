import React, { useState, useEffect } from 'react';

const MarketFeed = () => {
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        const socket = new WebSocket("ws://poc.symphonymarket.solutions/ws");

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
            <table>
                <thead>
                    <tr>
                        {messages.length > 0 && Object.keys(messages[0]).map((key) => (
                            <th key={key}>{key}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {messages.map((message, index) => (
                        <tr key={index}>
                            {Object.values(message).map((value, i) => (
                                <td key={i}>{JSON.stringify(value)}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default MarketFeed;