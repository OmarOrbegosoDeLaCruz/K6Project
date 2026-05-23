import http from 'k6/http';
import {sleep, check} from 'k6';

export const options = {
    stages: [
        {duration: '15s', target: 2000}, //ramp up
        {duration: '1m', target: 2000},  //stable
        {duration: '15s', target: 0}     //ramp down
    ],
    thresholds: {
        http_req_duration: ['p(30)<300']
    }
}

export default () => {
    const res = http.get('https://www.google.com/');
    check(res, {'200': (r) => r.status === 200});
    sleep(1);
}