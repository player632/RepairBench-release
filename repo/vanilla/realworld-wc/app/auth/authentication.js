import {LocalApi} from "../local-api/emulator";

export class Authentication {
    constructor() {
        if (!Authentication.inst) {
            Authentication.inst = this;
        } else {
            throw new Error('use instance');
        }

        this._callbacks = [];
        return Authentication.inst;
    }

    get auth() {
        return JSON.parse(localStorage.getItem('auth'));
    }

    set auth(value) {
        localStorage.setItem('auth', JSON.stringify(value));
    }

    onAuthenticate(callback) {
        this._callbacks.push(callback);
    }


    doAuthentication(email, password) {
        let user = {
            'user': {
                'email': email, 'password': password
            }
        };
        return new Promise((resolve, reject) => {
            LocalApi.handle('POST', '/users/login', JSON.stringify(user), {
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json'
            }).then(res=>res.json()).then(res => {
                if (res.user) {
                    resolve(res.user);
                    setTimeout(() => {
                        this.auth = res.user;
                        this._callbacks.forEach(callback => callback(res.user));
                    }, 400);
                } else {
                    reject(res.errors)
                }
            });
        });

    }

    static get instance() {
        return Authentication.inst;
    }
}
Authentication.inst = null;
