import React from 'react';
import ReactDOM from 'react-dom/client';
import ReactGA from 'react-ga4';
import { Metric } from 'web-vitals';
import App from './App';
import './index.css';
import reportWebVitals from './reportWebVitals';

ReactGA.initialize('G-9VPNTDELD2');

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
    <React.StrictMode>
        <App />,
    </React.StrictMode>,
);

function sendToAnalytics({ name, delta, value, id }: Metric) {
    ReactGA.event(name, {
        value: delta,
        metric_id: id,
        metric_value: value,
        metric_delta: delta,
        category: 'Web Vitals',
        action: name,
        label: id,
        nonInteraction: true,
        transport: 'beacon',
    });
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals(sendToAnalytics);
