import {Http} from "../http/http";
import {RouterHandler} from "../router/router-handler";
"use strict";

export class SettingsComponent extends HTMLElement {
    constructor(params) {
        super();
        this.$logoutButton = null;
        this.logoutHandler = this.logoutHandler.bind(this);
        this.updateHandler = this.updateHandler.bind(this);
    }

    static get observedAttributes() {
        return [];
    }

    attributeChangedCallback(name, oldValue, newValue) {

    }

    disconnectedCallback() {
        this.$logoutButton.removeEventListener('click', this.logoutHandler);
        this.$updateButton.removeEventListener('click', this.updateHandler);
    }

    connectedCallback() {
        Http.instance.doGet('user', true).then(r => {
            return r.json();
        }).then(response => {
            this.user = response.user;
            this.innerHTML = this.render();
            this.$logoutButton = this.querySelector('#logoutButton');
            this.$logoutButton.addEventListener('click', this.logoutHandler);
            this.$updateButton = this.querySelector('#update-button');
            this.$updateButton.addEventListener('click', this.updateHandler);
            this.$errorMessages = this.querySelector('.error-messages');
        });
    }

    logoutHandler(e) {
        e.preventDefault();
        localStorage.removeItem('auth');
        RouterHandler.getInstance.router.navigate('/');
    }

    updateHandler(e) {
        let $form = this.querySelector('form');
        if ($form.checkValidity()) {
            e.preventDefault();
            const data = {
                "user": {
                    "email": this.querySelector('#user-email').value,
                    "bio": this.querySelector('#user-bio').value,
                    "image": this.querySelector('#user-image').value,
                    "username": this.querySelector('#username').value,
                }
            };

            let password = this.querySelector('#user-password').value;
            if (password && password.length > 0) {
                data.user.password = password;
            }
            Http.instance.doPut('/user', JSON.stringify(data), true).then(r => {
                if (r.errors) {
                    let errors = r.errors;
                    for (var prop in errors) {
                        if (!errors.hasOwnProperty(prop)) continue;
                        while (this.$errorMessages.firstChild) {
                            this.$errorMessages.removeChild(this.$errorMessages.firstChild);
                        }
                        errors[prop].forEach(m => {
                            let text = prop + " " + m;
                            let errorItem = document.createElement('li');
                            errorItem.textContent = text;
                            errorItem.dataset.testid = 'error-item';
                            this.$errorMessages.appendChild(errorItem);
                        });
                    }
                } else {
                }
            });
        }
    }

    render() {
        return `
<div class="settings-page">
  <div class="container page">
    <div class="row">

      <div class="col-md-6 offset-md-3 col-xs-12">
        <h1 class="text-xs-center">Your Settings</h1>
        <ul class="error-messages" data-testid="settings-errors">
          <!--<li>That email is already taken</li>-->
        </ul>
        <form>
          <fieldset>
              <fieldset class="form-group">
                <input id="user-image" class="form-control" value="${this.user.image ? this.user.image : ''}" type="text" placeholder="URL of profile picture" data-testid="settings-image">
              </fieldset>
              <fieldset class="form-group">
                <input id="username" class="form-control form-control-lg" value="${this.user.username}" type="text" placeholder="Your Name" data-testid="settings-username">
              </fieldset>
              <fieldset class="form-group">
                <textarea id="user-bio" class="form-control form-control-lg"  rows="8" placeholder="Short bio about you" data-testid="settings-bio">${this.user.bio ? this.user.bio : ''}</textarea>
              </fieldset>
              <fieldset class="form-group">
                <input id="user-email" class="form-control form-control-lg" type="text"  value="${this.user.email}" placeholder="Email" data-testid="settings-email">
              </fieldset>
              <fieldset class="form-group">
                <input id="user-password" class="form-control form-control-lg" type="password" placeholder="Password" data-testid="settings-password">
              </fieldset>
              <button id="update-button" class="btn btn-lg btn-primary pull-xs-right" data-testid="settings-update">
                Update Settings
              </button>
          </fieldset>
        </form>
        <hr>
        <button id="logoutButton" class="btn btn-outline-danger" data-testid="settings-logout">Or click here to logout.</button>
      </div>

    </div>
  </div>
</div>
        `;
    }


}
