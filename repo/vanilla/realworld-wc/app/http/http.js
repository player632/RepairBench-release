import {Authentication} from "../auth/authentication";
import {config} from "../config";
import {RouterHandler} from "../router/router-handler";
import {LocalApi} from "../local-api/emulator";

export class Http {
    constructor() {
        if (!Http.inst) {
            Http.inst = this;
        } else {
            throw new Error('use instance');
        }

        return Http.inst;
    }

    static get instance() {
        return Http.inst;
    }

    doGet(path, authentication) {
        const headers = {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json',
        };

        if (authentication === true) {
            const auth = Authentication.instance.auth;
            if(auth) {
            }
        }
        return LocalApi.handle('GET', path, null, headers);
    }

    doPost(path, body, authentication) {
        const headers = {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json',
        };

        if (authentication === true) {
            const auth = Authentication.instance.auth;
            var token = null;
            if (auth) {
                token = auth.token;
            } else {
                //stop immediately
                RouterHandler.instance.router.navigate('#/login');
                return new Promise((resolve, rej) => {
                    rej();
                });
            }
            headers['Authorization'] = 'Token ' + token;
        }
        return LocalApi.handle('POST', path, body, headers).then(response => {
            if (response.status === 401) {
                RouterHandler.instance.router.navigate('#/login');
            }
            return response.json();
        });
    }

    doPut(path, body, authentication) {
        const headers = {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json',
        };

        if (authentication === true) {
            const auth = Authentication.instance.auth;
            var token = null;
            if (auth) {
                token = auth.token;
            } else {
                //stop immediately
                RouterHandler.instance.router.navigate('#/login');
                return new Promise((resolve, rej) => {
                    rej();
                });
            }
            headers['Authorization'] = 'Token ' + token;
        }
        return LocalApi.handle('PUT', path, body, headers).then(response => {
            if (response.status === 401) {
                RouterHandler.instance.router.navigate('#/login');
            }
            return response.json();
        });
    }

    doDelete(path, authentication) {
        const headers = {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json',
        };

        if (authentication === true) {
            const auth = Authentication.instance.auth;
            var token = null;
            if (auth) {
                token = auth.token;
            }
            headers['Authorization'] = 'Token ' + token;
        }

        return LocalApi.handle('DELETE', path, null, headers).then(function (response) {
            if (response.status === 401) {
                RouterHandler.instance.router.navigate('#/login');
            }
            return response.json();
        });
    }
}
Http.inst = null;
