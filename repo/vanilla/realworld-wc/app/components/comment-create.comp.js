import {Authentication} from "../auth/authentication";
import {LOCAL_AVATAR_DATA_URI} from "../local-api/assets";

export class CommentCreateComponent extends HTMLElement {
    constructor() {
        super();
        this.postComment = this.postComment.bind(this);
        this.auth = Authentication.instance.auth;
        this.image = LOCAL_AVATAR_DATA_URI;
        if (this.auth) {
            this.image = this.auth.image;
        }
    }

    static get observedAttributes() {
        return [];
    }

    attributeChangedCallback(name, oldValue, newValue) {
    }

    connectedCallback() {
        if (this.auth) {
            this.innerHTML = this.renderCommentForm();
            this.$postCommentBtn = this.querySelector('#postCommentBtn');
            this.$commentValue = this.querySelector('#comment-value');
            this.$postCommentBtn.addEventListener('click', this.postComment)
        } else {
            this.innerHTML = this.renderLoginButtons();
        }
    }

    postComment(e) {
        e.preventDefault();
        var event = new CustomEvent('comment');
        this.dispatchEvent(event);
    }

    disconnectedCallback() {
        if (this.auth) {
            this.$postCommentBtn.removeEventListener('click', this.postComment)
        }
    }

    renderCommentForm() {
        return `
        <form class="card comment-form">
          <div class="card-block">
            <textarea id="comment-value" class="form-control" placeholder="Write a comment..." rows="3" data-testid="comment-input"></textarea>
          </div>
          <div class="card-footer">
            <img src="${this.image ? this.image : LOCAL_AVATAR_DATA_URI}" class="comment-author-img" />
            <button id="postCommentBtn" class="btn btn-sm btn-primary" data-testid="comment-post-btn">
             Post Comment
            </button>
          </div>
        </form>
`;
    }

    renderLoginButtons() {
        return `
<div class="col-xs-12 col-md-8 offset-md-2" data-testid="comment-guest-prompt">
<p>
<a class="" href="#/login">Sign in</a>
 or 
<a class="" href="#/register">sign up</a>
 to add comments on this article.
</p>
<div>

</div>
</div>`;
    }

}
