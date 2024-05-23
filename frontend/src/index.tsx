import ReactDOM from 'react-dom/client';
import ReactGA from 'react-ga4';
import { ReportCallback } from 'web-vitals';
import App from './App';
import './index.css';
import reportWebVitals from './reportWebVitals';

ReactGA.initialize('G-9VPNTDELD2');

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
    // <React.StrictMode>
    <App />,
    // </React.StrictMode>
);

const sendToAnalytics: ReportCallback = ({ id, name, value }) => {
    ReactGA.event({
        category: 'Web Vitals',
        action: name,
        label: id,
        value: Math.round(name === 'CLS' ? value * 1000 : value),
        nonInteraction: true,
        transport: 'beacon',
    });
};

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals(sendToAnalytics);
