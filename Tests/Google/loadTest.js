import http from 'k6/http';
import {sleep, check} from 'k6';

export const options = {
    stages: [
        {duration: '30s', target: 200}, // ramp up
        {duration: '5m', target: 200}, // stable
        {duration: '30s', target:0} // ramp down
    ],
    thresholds: {
        http_req_duration: ['p(30)<300'] // 30 percent of request should complete in less than 300ms
    }

};

export default () => {
    const res = http.get('https://www.google.com/');
    check(res, {'200': (r) => r.status === 200});
    sleep(1);
};