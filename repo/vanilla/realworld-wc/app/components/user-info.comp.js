import {Authentication} from "../auth/authentication";
import {Http} from "../http/http";
export class UserInfoComponent extends HTMLElement {

    constructor() {
        super();
        this.auth = Authentication.instance.auth;
        this.followButtonAction = this.followButtonAction.bind(this);
    }

    static get observedAttributes() {
        return [];
    }

    attributeChangedCallback(name, oldValue, newValue) {

    }

    connectedCallback() {
        this.username = this.getAttribute('username');

        Http.instance.doGet('profiles/' + this.username, true).then(res => {
            return res.json();
        }).then(r => {
            this.model = r.profile;
            this.innerHTML = this.render();
            this.$followButton = this.querySelector('#follow-button');
            if (this.$followButton) {
                this.$followButton.addEventListener('click', this.followButtonAction);
            }
        });
    }

    followButtonAction(e) {
        if (this.model.following) {
            Http.instance.doDelete('profiles/' + this.model.username + '/follow', true).then(r => {
                this.model = r.profile;
                this.$followButton.innerHTML = this.renderFollowButton();
            });
        } else {
            Http.instance.doPost('profiles/' + this.model.username + '/follow', JSON.stringify({}), true).then(r => {
                this.model = r.profile;
            });
        }
    }


    disconnectedCallback() {
        if (this.$followButton) {
            this.$followButton.removeEventListener('click', this.followButtonAction);
        }
    }

    renderFollowButton() {
        return `<i class="ion-plus-round"></i>
                        ${this.model.following ? 'Unfollow' : 'Follow'} ${this.username}`;
    }

    render() {
        return `
        <div class="user-info">
            <div class="container">
              <div class="row">
            
                <div class="col-xs-12 col-md-10 offset-md-1">
                  <img id="user-img" src="${this.model.image}" class="user-img" data-testid="profile-image" />
                  <h4 id="username" data-testid="profile-username">${this.username}</h4>
                  <p id="bio" data-testid="profile-bio">
                    ${this.model.bio ? this.model.bio : ''}
                  </p>
                  ${!this.auth || this.username !== this.auth.username ?
            `<button id="follow-button" class="btn btn-sm btn-outline-secondary action-btn" data-testid="profile-follow-btn">
                    ${this.renderFollowButton()}
                    </button>` :
            `<a class="btn btn-sm btn-outline-secondary action-btn" href="/#/settings" data-testid="profile-edit-link"><i class="ion-gear-a"></i> Edit Profile Settings</a>`
            }
                </div>
            
              </div>
            </div>
        </div>
`;
    }
}
