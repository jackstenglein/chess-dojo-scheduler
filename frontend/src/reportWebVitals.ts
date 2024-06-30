import { Metric, onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

function reportWebVitals(sendToAnalytics: (metric: Metric) => void) {
    onCLS(sendToAnalytics);
    onINP(sendToAnalytics);
    onFCP(sendToAnalytics);
    onLCP(sendToAnalytics);
    onTTFB(sendToAnalytics);
}

export default reportWebVitals;
