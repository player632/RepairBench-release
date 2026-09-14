import { createGlobalStyle } from "styled-components";

export const GlobalStyles = createGlobalStyle`
*,
*::after,
*::before {
box-sizing: border-box;
}
body {
display: flex;
flex-direction: column;
align-items: center;
justify-content: center;
height: 100%;
width: 100%;
background: ${({ theme }) => theme.background};
color: ${({ theme }) => theme.text};
padding: 0;
margin: 0;
font-family: ${({ theme }) => theme.fontFamily};
transition: all 0.25s linear;
text-shadow: ${({ theme }) => theme.textShadow};
}
.canvas {
align-items: center;
display: grid;
gap: 1rem;
grid-auto-flow: row;
grid-template-rows: auto 1fr auto;
min-height: 100vh;
width: 100vw;
z-index: 1;
padding: 1rem;
transition: padding-top .125s;
}
.fixed-overlay {
position: fixed;
top: 0;
left: 0;
width: 100%;
height: 100%;
background: rgba(0, 0, 0, 0.5); /* Dark background with opacity */
display: flex;
align-items: center;
justify-content: center;
z-index: 9999; /* Ensure the overlay is on top */
}

.modal-content {
background: ${({ theme }) => theme.background};
padding: 40px; /* Increased padding */
border-radius: 8px;
position: relative; /* To position the close button */
width: 80%; /* Increased width */
max-width: 600px; /* Max width to keep it from getting too large */
height: auto; /* Allow height to grow with content */
}
.close-button {
color: ${({ theme }) => theme.textTypeBox};
}
.modal-title {
margin-bottom: 20px; /* Add space below title */
}

.modal-description {
margin-bottom: 20px; /* Add space below description */
}

.modal-icons {
margin-top: 20px; /* Add space above icons */
}
.dynamicBackground {
heigh: 100%;
width: 100%;
z-index: -999;
position: fixed;
filter: grayscale(30%);
}
.header {
position: relative;
display: flex;
flex-direction: column;
align-items: center;
width: 100%;
z-index: 999;
gap: 0;
}
.header-banner {
font-size: 12px;
color: ${({ theme }) => theme.textTypeBox};
display: flex;
align-items: center;
gap: 0;
overflow: hidden;
white-space: nowrap;
text-overflow: ellipsis;
opacity: 0.6;
}
.header-banner-prompt {
color: ${({ theme }) => theme.stats};
margin-right: 6px;
font-family: monospace;
opacity: 0.8;
}
.header-banner-link {
color: ${({ theme }) => theme.textTypeBox};
text-decoration: none;
}
.header-banner-link:hover {
color: ${({ theme }) => theme.stats};
}
.header-banner-sep {
color: ${({ theme }) => theme.textTypeBox};
opacity: 0.6;
margin: 0 6px;
}
.header-banner-close {
background: none;
border: none;
color: ${({ theme }) => theme.stats};
cursor: pointer;
padding: 0 2px;
display: inline-flex;
align-items: center;
opacity: 0.8;
transition: opacity 0.2s;
margin-left: 8px;
flex-shrink: 0;
}
.header-banner-close:hover {
opacity: 1;
}
.logo-row {
display: flex;
flex-direction: column;
align-items: flex-start;
gap: 4px;
width: 100%;
padding-left: 0.5rem;
padding-right: 72px;
}
.logo-top {
display: flex;
align-items: baseline;
gap: 12px;
}
.logo-title {
font-size: 22px;
font-weight: 300;
letter-spacing: 4px;
color: ${({ theme }) => theme.title};
opacity: 0.9;
margin: 0;
display: flex;
align-items: center;
gap: 2px;
flex-shrink: 0;
}
.logo-accent {
font-weight: 400;
}
.logo-gant {
font-size: 16px;
font-weight: 300;
color: ${({ theme }) => theme.textTypeBox};
letter-spacing: 1px;
opacity: 0.6;
}
.logo-icon {
font-size: 20px;
margin-left: 4px;
opacity: 0.7;
}
.user-greeting {
font-size: 13px;
color: ${({ theme }) => theme.textTypeBox};
opacity: 0.8;
letter-spacing: 0.5px;
overflow: hidden;
text-overflow: ellipsis;
white-space: nowrap;
min-width: 0;
}
@media (max-width: 600px) {
.user-greeting {
display: none;
}
.header-banner {
max-width: 100%;
}
.logo-row {
padding-right: 56px;
}
}
/* Profile area */
.profile-area {
position: fixed;
right: 16px;
top: 16px;
z-index: 1000;
display: flex;
align-items: center;
gap: 4px;
}

/* Name card */
.namecard {
font-family: monospace;
overflow: hidden;
max-width: 220px;
transition: max-width 0.4s cubic-bezier(0.4, 0, 0.2, 1),
            opacity 0.3s ease;
}
.namecard-visible {
max-width: 220px;
opacity: 1;
}
.namecard-hidden {
max-width: 0;
opacity: 0;
pointer-events: none;
}
.namecard-slide-btn {
background: none;
border: none;
color: ${({ theme }) => theme.stats};
cursor: pointer;
font-size: 20px;
font-family: monospace;
padding: 0 2px;
opacity: 0.6;
transition: opacity 0.2s;
display: flex;
align-items: center;
flex-shrink: 0;
line-height: 1;
}
.namecard-slide-btn:hover {
opacity: 1;
}
.namecard-header {
display: flex;
align-items: center;
gap: 8px;
padding: 4px 10px;
cursor: pointer;
border: 1px solid ${({ theme }) => theme.textTypeBox}30;
border-radius: 6px;
background: ${({ theme }) => theme.background};
backdrop-filter: blur(12px);
-webkit-backdrop-filter: blur(12px);
transition: border-color 0.2s;
white-space: nowrap;
}
.namecard-header:hover {
border-color: ${({ theme }) => theme.stats}60;
}
.namecard-rank {
font-size: 14px;
font-family: monospace;
flex-shrink: 0;
letter-spacing: 1px;
}
.namecard-info {
display: flex;
flex-direction: column;
min-width: 0;
overflow: hidden;
}
.namecard-name {
font-size: 13px;
font-weight: 500;
white-space: nowrap;
overflow: hidden;
text-overflow: ellipsis;
}
.namecard-tag {
font-size: 11px;
margin-left: 4px;
opacity: 0.6;
}
.namecard-title {
font-size: 11px;
opacity: 0.8;
}
.profile-btn {
background: none;
border: none;
color: ${({ theme }) => theme.text};
cursor: pointer;
display: inline-flex;
align-items: center;
gap: 1px;
padding: 4px 2px;
font-family: monospace;
opacity: 0.8;
transition: opacity 0.2s;
flex-shrink: 0;
}
.profile-btn:hover {
opacity: 1;
}
.profile-bracket {
font-size: 18px;
color: ${({ theme }) => theme.stats};
font-weight: 300;
}
.profile-badge {
font-size: 10px;
font-family: monospace;
background: transparent;
color: ${({ theme }) => theme.stats};
border: 1px solid ${({ theme }) => theme.stats};
border-radius: 50%;
min-width: 16px;
height: 16px;
display: inline-flex;
align-items: center;
justify-content: center;
font-weight: 700;
margin-left: 2px;
position: relative;
top: -6px;
}

small {
display: block;
}
button {
display: block;
}
h1 {
color: ${({ theme }) => theme.title};
opacity: 0.9;
margin-top: 10px;
margin-bottom: 10px;
}
h3{
margin-right: 10px;
}
h4{
margin-right: 10px;
opacity: 0.7;
}
.bottomBar {
z-index: 999;
}

/* Footer nav */
.nav-container {
display: flex;
align-items: flex-end;
justify-content: center;
gap: 16px;
flex-wrap: wrap;
padding: 4px 0;
}
.nav-group {
display: flex;
flex-direction: column;
align-items: center;
gap: 3px;
}
.nav-group-label {
font-size: 11px;
text-transform: uppercase;
letter-spacing: 1.5px;
color: ${({ theme }) => theme.stats};
opacity: 0.85;
text-shadow: none;
}
.nav-group-items {
display: flex;
align-items: center;
gap: 4px;
border: 1px solid ${({ theme }) => theme.textTypeBox}40;
border-radius: 6px;
padding: 6px 8px;
min-height: 40px;
}
.nav-group-links {
margin-left: auto;
}
.nav-group-links .nav-group-items {
/* Transparent border keeps the box geometry identical to labeled groups
   so icons align across the row; border:none collapses the box by ~2px. */
border: 1px solid transparent;
/* Nudge the links cluster a little lower than the labeled groups so it sits
   closer to the visual baseline of the footer bar without clipping. */
transform: translateY(6px);
}
.nav-item {
color: ${({ theme }) => theme.text};
opacity: 0.7;
transition: all 0.2s;
display: inline-flex;
align-items: center;
}
.nav-item:hover {
opacity: 1;
}
.nav-item-active {
color: ${({ theme }) => theme.stats};
opacity: 1;
transition: all 0.2s;
display: inline-flex;
align-items: center;
}
.nav-mode {
color: ${({ theme }) => theme.text};
opacity: 0.65;
font-size: 15px;
font-weight: 500;
transition: all 0.2s;
display: inline-flex;
align-items: center;
}
.nav-mode:hover {
opacity: 1;
}
.nav-mode-active {
color: ${({ theme }) => theme.stats};
display: inline-flex;
align-items: center;
opacity: 1;
font-size: 15px;
font-weight: 600;
transition: all 0.2s;
}

.stats-overlay {
position: fixed;
background: ${({ theme }) => theme.background};
backdrop-filter: blur(20px);
-webkit-backdrop-filter: blur(20px);
inset: 0;
z-index: 99;
padding-inline: 1rem;
}

.stats-chart {
position: absolute;
background: transparent;
top: 50%;
width: 100%;
max-width: 1000px;
left: 50%;
transform: translate(-50%, -50%);
display: flex;
padding-inline: 1rem;
flex-direction: column;
gap: 20px;
max-height: 80vh;
overflow-y: auto;
scrollbar-width: thin;
scrollbar-color: ${({ theme }) => theme.stats} transparent;
}

.custom-tooltip {
position: relative;
}

.custom-tooltip::before {
content: "";
position: absolute;
width: 100%;
height: 100%;
inset: 0;
background: ${({ theme }) => theme.background};
z-index: -1;
border: 1px solid ${({ theme }) => theme.textTypeBox};
opacity: .9;
}

.stats-header {
width: 100%;
display: grid;
grid-template-columns: auto 1fr;
gap: 16px;
}

.stats {
display: block;
max-width: 1000px;
margin-top: 50px;
margin-bottom: 20px;
margin-left: auto;
margin-right: auto;
color: ${({ theme }) => theme.stats};
bottom: 10%;
}

.stats-footer {
display: flex;
justify-content: space-between;
}
.wordscard-UI{
display: block;
max-width: 1000px;
margin-top: 150px;
margin-bottom: 20px;
margin-left: auto;
margin-right: auto;
bottom: 10%;
}
.wordscard-UI-info{
margin-top: 30px;
margin-bottom: 20px;
margin-left: auto;
margin-right: auto;
color: ${({ theme }) => theme.textTypeBox};
bottom: 10%;
}
.keyboard-stats {
display: flex;
max-width: 1000px;
margin-top: 50px;
margin-bottom: 20px;
margin-left: auto;
margin-right: auto;
color: ${({ theme }) => theme.stats};
bottom: 10%;
justify-content: center;
text-align: center;
}
.sub-header {
color: ${({ theme }) => theme.textTypeBox};
opacity: 0.5;
border-right: 2px solid;
animation: blinkingCursor 2s infinite;;
@keyframes blinkingCursor{
0%		{ border-right-color: ${({ theme }) => theme.stats};}
25%		{ border-right-color: transparent;}
50%		{ border-right-color: ${({ theme }) => theme.stats};}
75%		{border-right-color: transparent;}
100%	{border-right-color: ${({ theme }) => theme.stats};}
}
}
.type-box {
display: block;
max-width: 1000px;
/* 3 rows: each row = 28px font * 1.4 line-height + 8px margin + 2px border = ~49.2px */
height: calc((28px * 1.4 + 8px + 2px) * 3);
overflow: hidden;
margin-left: auto;
margin-right: auto;
position: relative;
top: 10%;
@media only screen
and (min-device-width: 375px)
and (max-device-width: 812px)
and (-webkit-min-device-pixel-ratio: 3) {
top:200px;
width: 60%;
}
}
.type-box-chinese {
display: block;
max-width: 1000px;
/* 3 rows: each row = pinyin(20px * 1.4 + 8px) + word(28px * 1.4 + 10px margin-bottom) + 2px border ≈ 87px */
height: calc((20px * 1.4 + 8px + 28px * 1.4 + 10px + 2px) * 3);
overflow: hidden;
margin-left: auto;
margin-right: auto;
position: relative;
top: 10%;
@media only screen
and (min-device-width: 375px)
and (max-device-width: 812px)
and (-webkit-min-device-pixel-ratio: 3) {
top:200px;
width: 60%;
}
}
.words{
color: ${({ theme }) => theme.textTypeBox};
font-size: 28px;
line-height: 1.4;
display: flex;
flex-wrap: wrap;
width: 100%;
align-content: flex-start;
user-select: none;
}
.word{
margin: 4px 5px;
display: flex;
padding-right: 2px;
border-bottom: 1px solid transparent;
border-top: 1px solid transparent;
scroll-margin: 4px;
}
.active-word{
animation: blinkingBackground 2s infinite;
border-top: 1px solid transparent;
border-bottom: 1px solid;
@keyframes blinkingBackground{
0%		{ border-bottom-color: ${({ theme }) => theme.stats};}
25%		{ border-bottom-color: ${({ theme }) => theme.textTypeBox};}
50%		{ border-bottom-color: ${({ theme }) => theme.stats};}
75%		{border-bottom-color: ${({ theme }) => theme.textTypeBox};}
100%	{border-bottom-color: ${({ theme }) => theme.stats};}
};
scroll-margin: 4px;
}
.active-word-no-pulse{
border-top: 1px solid transparent;
border-bottom: 1px solid transparent;
scroll-margin: 4px;
}
.error-word{
border-bottom: 1px solid red;
scroll-margin: 4px;
}
.char{
border-left: 1px solid transparent;
border-right: 1px solid transparent;
}
.correct-char{
border-left: 1px solid transparent;
border-right: 1px solid transparent;
color: ${({ theme }) => theme.text};

}
.error-char{
border-left: 1px solid transparent;
border-right: 1px solid transparent;
color: red;

}
.caret-char-left{
border-left: 1px solid ${({ theme }) => theme.stats};
border-right: 1px solid transparent;

}
.caret-char-left-start{

border-left: 1px solid;
border-right: 1px solid transparent;
animation: blinkingCaretLeft 2s infinite;
animation-timing-function: ease;
@keyframes blinkingCaretLeft{
0%		{ border-left-color: ${({ theme }) => theme.stats};}
25%		{ border-left-color: ${({ theme }) => theme.textTypeBox};}
50%		{ border-left-color: ${({ theme }) => theme.stats};}
75%		{ border-left-color: ${({ theme }) => theme.textTypeBox};}
100%	{ border-left-color: ${({ theme }) => theme.stats};}
}
}
.caret-char-right{
border-right: 1px solid ${({ theme }) => theme.stats};
border-left: 1x solid transparent;

}
.caret-char-right-correct{
color: ${({ theme }) => theme.text};
border-right: 1px solid ${({ theme }) => theme.stats};
border-left: 1px solid transparent;

}
.caret-char-right-error{
color: red;
border-right: 1px solid ${({ theme }) => theme.stats};
border-left: 1px solid transparent;

}
.caret-extra-char-right-error{
color: red;
border-right: 1px solid ${({ theme }) => theme.stats};
border-left: 1px solid transparent;

}

.hidden-input{
opacity:0;
filter:alpha(opacity=0);
}
.select {
color: ${({ theme }) => theme.text};
background: ${({ theme }) => theme.background};
border: none;
min-width: 5%;
}
.restart-button{
margin-left: auto;
margin-right: auto;
width: 8em
}
.restart-button button:hover{
transform:scale(1.18);
transition:0.3s;
}
.alert{
opacity: 0.3;
background-image: ${({ theme }) => theme.gradient};
}
.correct-char-stats{
color: ${({ theme }) => theme.text};
}
.incorrect-char-stats{
color: red;
}
.missing-char-stats{
color: ${({ theme }) => theme.textTypeBox};
}
.speedbar{
opacity: 0.3;
color:  ${({ theme }) => theme.stats};
}
.active-button{
color: ${({ theme }) => theme.stats};
}
.inactive-button{
color: ${({ theme }) => theme.textTypeBox};
}
.zen-button{
color: ${({ theme }) => theme.stats};
}
.zen-button-deactive{
color: ${({ theme }) => theme.textTypeBox};
}
.support-me{
color : #FF4081;
animation: blinkingColor 10s infinite;
@keyframes blinkingColor{
0%		{ color: #F48FB1;}
25%		{ color: #FF4081;}
50%		{ color: #F48FB1;}
75%		{color: #FF4081;}
100%	 {color: #F48FB1;}
}
}
.support-me-image{
height: 75%;
width: 75%;
display: block;
margin-left: auto;
margin-right: auto;
margin-top: 8px;
margin-bottom: 8px;
border-radius: 16px;
}
.menu-separater{
color: ${({ theme }) => theme.textTypeBox};
background-color: none;
font-size: 16px;
}
.chinese-word{
margin-left: 10px;
margin-right: 10px;
margin-bottom: 10px;
display: flex;
padding-right: 2px;
border-bottom: 1px solid transparent;
border-top: 1px solid transparent;
}
.chinese-word-key{
margin: 4px 4px;
color: ${({ theme }) => theme.textTypeBox};
background-color: none;
display: flex;
justify-content: center;
font-size: 20px;
scroll-margin: 4px;
text-align: center;
}
.error-chinese{
color: red;
}
.active-chinese{
color: ${({ theme }) => theme.stats};
}
.dialog{
background: ${({ theme }) => theme.background};
}
.key-type{
background: ${({ theme }) => theme.textTypeBox};
color: ${({ theme }) => theme.stats};
border-radius: 4px;
}
.key-note{
color: ${({ theme }) => theme.stats};
background: transparent;
}
.novelty-container{
width: 95%;
max-width: 1600px;
height: 100%;
margin-left: auto;
margin-right: auto;
position: relative;
display: flex;
flex-direction: column;
}
.textarea{
color: ${({ theme }) => theme.textTypeBox};
font-size: 28px;
background: transparent;
border: none;
caret-color: ${({ theme }) => theme.stats};
font-family: ${({ theme }) => theme.fontFamily};
overflow: auto;
resize: none;
width: 100%;
height: 70vh;
margin-left: auto;
margin-right: auto;
position: relative;
outline: none;
border-radius: 4px;
border-left: 3px solid transparent;
transition: border-color 0.2s;
}
.textarea:focus{
border-left: 3px solid ${({ theme }) => theme.stats};
}
.textarea::placeholder{
color: ${({ theme }) => theme.textTypeBox};

@media only screen 
and (min-device-width: 375px) 
and (max-device-width: 812px) 
and (-webkit-min-device-pixel-ratio: 3) { 
top:200px;
width: 60%;
}
}
.md-toolbar{
display: flex;
align-items: center;
justify-content: space-between;
gap: 8px;
margin-bottom: 10px;
flex-wrap: wrap;
}
.md-toolbar-group{
display: flex;
align-items: center;
gap: 4px;
border: 1px solid ${({ theme }) => theme.textTypeBox}20;
border-radius: 6px;
padding: 3px;
}
.md-toolbar-btn{
background: transparent;
border: none;
border-radius: 4px;
color: ${({ theme }) => theme.textTypeBox};
font-family: ${({ theme }) => theme.fontFamily};
font-size: 13px;
padding: 5px 12px;
cursor: pointer;
transition: all 0.15s;
white-space: nowrap;
}
.md-toolbar-btn:hover{
background: ${({ theme }) => theme.textTypeBox}15;
color: ${({ theme }) => theme.text};
}
.md-toolbar-btn-active{
background: ${({ theme }) => theme.stats}20;
color: ${({ theme }) => theme.stats};
font-weight: 600;
}
.md-divider{
width: 1px;
background: ${({ theme }) => theme.textTypeBox}25;
flex-shrink: 0;
}
.markdown-preview{
color: ${({ theme }) => theme.textTypeBox};
font-family: ${({ theme }) => theme.fontFamily};
}
.markdown-preview h1,.markdown-preview h2,.markdown-preview h3,
.markdown-preview h4,.markdown-preview h5,.markdown-preview h6{
color: ${({ theme }) => theme.text};
margin: 0.8em 0 0.4em;
line-height: 1.3;
}
.markdown-preview h1{ font-size: 1.8em; border-bottom: 1px solid ${({ theme }) => theme.textTypeBox}20; padding-bottom: 0.3em; }
.markdown-preview h2{ font-size: 1.4em; border-bottom: 1px solid ${({ theme }) => theme.textTypeBox}15; padding-bottom: 0.2em; }
.markdown-preview h3{ font-size: 1.2em; }
.markdown-preview p{ margin: 0.6em 0; }
.markdown-preview a{ color: ${({ theme }) => theme.stats}; text-decoration: underline; }
.markdown-preview code{
background: ${({ theme }) => theme.textTypeBox}15;
padding: 2px 6px;
border-radius: 3px;
font-family: monospace;
font-size: 0.9em;
}
.markdown-preview pre{
background: ${({ theme }) => theme.textTypeBox}10;
padding: 12px 16px;
border-radius: 6px;
overflow-x: auto;
margin: 0.8em 0;
}
.markdown-preview pre code{
background: none;
padding: 0;
font-size: 0.85em;
}
.markdown-preview blockquote{
border-left: 3px solid ${({ theme }) => theme.stats}66;
margin: 0.8em 0;
padding: 4px 16px;
color: ${({ theme }) => theme.textTypeBox}cc;
}
.markdown-preview ul,.markdown-preview ol{
margin: 0.5em 0;
padding-left: 1.5em;
}
.markdown-preview li{ margin: 0.3em 0; }
.markdown-preview hr{
border: none;
border-top: 1px solid ${({ theme }) => theme.textTypeBox}20;
margin: 1em 0;
}
.markdown-preview img{ max-width: 100%; border-radius: 4px; }
.markdown-preview table{ border-collapse: collapse; width: 100%; margin: 0.8em 0; }
.markdown-preview th,.markdown-preview td{
border: 1px solid ${({ theme }) => theme.textTypeBox}25;
padding: 6px 12px;
text-align: left;
}
.markdown-preview th{
background: ${({ theme }) => theme.textTypeBox}10;
font-weight: 600;
}
.active-game-mode-button{
color: ${({ theme }) => theme.stats};
font-size: 16px;
}
.inactive-game-mode-button{
color: ${({ theme }) => theme.textTypeBox};
font-size: 16px;
}
.error-sentence-char{
color: red;
}
.error-sentence-space-char{
border-bottom: 1px solid red;
}
.wordcard-error-char-space-char{
border-bottom: 1px solid red;
white-space:pre;
padding-right: 4px;
}
.wordcard-error-char{
color: red;
padding-right: 4px;
}
.wordcard-char{
color: ${({ theme }) => theme.textTypeBox};
padding-right: 4px;
}
.correct-wordcard-char{
color: ${({ theme }) => theme.text};
padding-right: 4px;
}
.sentence-char{
color: ${({ theme }) => theme.textTypeBox};
}
.correct-sentence-char{
color: ${({ theme }) => theme.text};
}
.sentence-input-field{
color: ${({ theme }) => theme.textTypeBox};
font-size: 28px;
background: transparent;
border: none;
caret-color: ${({ theme }) => theme.stats};
outline: none;
padding: 0;
font-family: ${({ theme }) => theme.fontFamily};
}
.sentence-display-field{
font-size: 28px;
}
.wordcard-word-display-field{
font-size: 64px;
margin: 40px;
}
.wordcard-meaning-display-field{
font-size: 20px;
margin-top: 40px;
margin-bottom: 10px;
}
.next-sentence-display{
font-family: ${({ theme }) => theme.fontFamily};
color: ${({ theme }) => theme.textTypeBox};
display: block;
margin-top: 10px;
font-size: 16px;
}
.type-box-sentence {
display: block;
max-width: 1000px;
height: 240px;
overflow: hidden;
margin-left: auto;
margin-right: auto;
position: relative
top: 10%;
@media only screen 
and (min-device-width: 375px) 
and (max-device-width: 812px) 
and (-webkit-min-device-pixel-ratio: 3) { 
top:200px;
width: 60%;
}
}

/* Profile sections */
.profile-section {
margin-bottom: 16px;
padding-bottom: 12px;
border-bottom: 1px solid ${({ theme }) => theme.textTypeBox}15;
}
.profile-section:last-child {
border-bottom: none;
margin-bottom: 0;
}
.profile-section-label {
font-size: 11px;
text-transform: uppercase;
letter-spacing: 1.5px;
color: ${({ theme }) => theme.textTypeBox};
opacity: 0.6;
margin: 0 0 8px 0;
font-weight: 400;
}

/* Submit score button */
.submit-score-btn {
background: transparent;
border: 1px solid;
border-radius: 4px;
padding: 6px 16px;
cursor: pointer;
font-size: 14px;
animation: submitPulse 2s ease-in-out infinite;
transition: transform 0.2s, box-shadow 0.2s;
}
.submit-score-btn:hover {
transform: scale(1.05);
animation: none;
}
@keyframes submitPulse {
0%, 100% { opacity: 1; transform: scale(1) rotate(0deg); }
20% { transform: scale(1.03) rotate(-1deg); }
40% { transform: scale(1) rotate(1deg); }
60% { transform: scale(1.03) rotate(-0.5deg); }
80% { transform: scale(1) rotate(0.5deg); }
}

/* Badge & Rank styles */
.rank-card {
display: flex;
align-items: center;
gap: 16px;
padding: 16px;
border: 1px solid ${({ theme }) => theme.textTypeBox}30;
border-radius: 8px;
margin-bottom: 20px;
}
.rank-keycap {
font-size: 28px;
font-family: monospace;
flex-shrink: 0;
letter-spacing: 1px;
}
.rank-keycap-bracket {
font-weight: 300;
}
.rank-info {
flex: 1;
}
.rank-name {
font-size: 18px;
font-weight: 600;
color: ${({ theme }) => theme.stats};
margin-bottom: 2px;
}
.rank-wpm {
font-size: 13px;
color: ${({ theme }) => theme.textTypeBox};
margin-bottom: 8px;
}
.rank-progress-container {
display: flex;
align-items: center;
gap: 10px;
}
.rank-progress-bar {
flex: 1;
height: 6px;
background: ${({ theme }) => theme.textTypeBox}30;
border-radius: 3px;
overflow: hidden;
}
.rank-progress-fill {
height: 100%;
background: ${({ theme }) => theme.stats};
border-radius: 3px;
transition: width 0.3s;
}
.rank-next {
font-size: 12px;
color: ${({ theme }) => theme.textTypeBox};
white-space: nowrap;
}
.rank-max {
font-size: 13px;
color: ${({ theme }) => theme.stats};
}
.badge-category-title {
font-size: 13px;
color: ${({ theme }) => theme.textTypeBox};
text-transform: uppercase;
letter-spacing: 1px;
margin: 0 0 8px 0;
}
.badge-grid {
display: flex;
flex-wrap: wrap;
gap: 8px;
}
.badge-item {
display: flex;
align-items: center;
gap: 6px;
padding: 6px 10px;
border-radius: 6px;
border: 1px solid ${({ theme }) => theme.textTypeBox}30;
font-size: 13px;
transition: all 0.2s;
position: relative;
}
.badge-item[data-tooltip]:hover::after {
content: attr(data-tooltip);
position: absolute;
bottom: calc(100% + 6px);
left: 50%;
transform: translateX(-50%);
background: ${({ theme }) => theme.background};
color: ${({ theme }) => theme.text};
border: 1px solid ${({ theme }) => theme.textTypeBox};
padding: 4px 8px;
border-radius: 4px;
font-size: 11px;
white-space: nowrap;
z-index: 10;
pointer-events: none;
}
.badge-earned {
color: ${({ theme }) => theme.text};
border-color: ${({ theme }) => theme.stats}60;
}
.badge-locked {
opacity: 0.35;
color: ${({ theme }) => theme.textTypeBox};
}
.badge-icon {
font-size: 16px;
}
.badge-name {
font-size: 12px;
}

/* Badge notification */
.badge-notification {
display: flex;
align-items: center;
gap: 12px;
padding: 10px 16px;
border: 1px solid ${({ theme }) => theme.stats}50;
border-radius: 8px;
background: ${({ theme }) => theme.stats}10;
animation: badgeFadeIn 0.5s ease-out;
}
.badge-notification-label {
font-size: 13px;
color: ${({ theme }) => theme.stats};
font-weight: 600;
white-space: nowrap;
}
.badge-notification-list {
display: flex;
gap: 12px;
flex-wrap: wrap;
}
.badge-notification-item {
font-size: 13px;
color: ${({ theme }) => theme.text};
}
@keyframes badgeFadeIn {
from { opacity: 0; transform: translateY(-8px); }
to { opacity: 1; transform: translateY(0); }
}

.keyboard {
display: flex;
flex-direction: column;
align-items: center;
justify-content: center;
margin-bottom: 40px;
}

.row {
list-style: none;
display: flex;
}
.row-1{
padding-left: 0em;
}
.row-2{
padding-left: 0.25em;
}
.row-3{
padding-left: 0.5em;
}
.row-4{
padding-left: 0em;
}

ul {
display: block;
list-style-type: disc;
margin-block-start: 0.25em;
margin-block-end: 0.25em;
margin-inline-start: 0px;
margin-inline-end: 0px;
padding-inline-start: 0px;
}
.SPACEKEY { 
height: 3em;
width: 21em;
color: ${({ theme }) => theme.text};
font-family: ${({ theme }) => theme.fontFamily};
border-radius: 0.4em;
line-height: 3em;
letter-spacing: 1px;
margin: 0.4em;
transition: 0.3s;
text-align: center;
font-size: 1em;
background-color: ${({ theme }) => theme.background};
border: 2px solid ${({ theme }) => theme.textTypeBox};
opacity: 0.8;
}
.UNITKEY { 
height: 3em;
width: 3em;
color: rgba(0,0,0,0.7);
border-radius: 0.4em;
line-height: 3em;
letter-spacing: 1px;
margin: 0.4em;
transition: 0.3s;
text-align: center;
font-size: 1em;
font-family: ${({ theme }) => theme.fontFamily};
background-color: ${({ theme }) => theme.background};
border: 2px solid ${({ theme }) => theme.textTypeBox};
opacity: 1;
color: ${({ theme }) => theme.text};
opacity: 0.8;
}
.VIBRATE {
background-color: ${({ theme }) => theme.textTypeBox};
-webkit-animation: vibrate-1 0.8s linear infinite both;
animation: vibrate-1 0.8s linear infinite both;
}
.VIBRATE-ERROR {
background-color: red;
-webkit-animation: vibrate-1 0.2s linear infinity both;
animation: vibrate-1 0.2s linear infinity both;
}
.NOVIBRATE-CORRECT {
background-color: ${({ theme }) => theme.textTypeBox};
}

@keyframes vibrate-1 {
0% {
-webkit-transform: translate(0);
transform: translate(0);
}
20% {
-webkit-transform: translate(-2px, 2px);
transform: translate(-2px, 2px);
}
40% {
-webkit-transform: translate(-2px, -2px);
transform: translate(-2px, -2px);
}
60% {
-webkit-transform: translate(2px, 2px);
transform: translate(2px, 2px);
}
80% {
-webkit-transform: translate(2px, -2px);
transform: translate(2px, -2px);
}
100% {
-webkit-transform: translate(0);
transform: translate(0);
}
}
.CorrectKeyDowns{
color: inherit;
}
.IncorrectKeyDowns{
color: red;
}
.words-card-container{
display: block;
width: 100%;
height: 100%;
}
.words-card-catalog{
width: 10%;
float: left;
text-align: left;
border-left: 2px groove ${({ theme }) => theme.stats};
border-top: 1px solid ${({ theme }) => theme.stats};
border-radius: 12px;
padding-left: 20px;
}
.words-card-main{
width: 80%;
height: 90%;
float: left;
text-align: center;
}
.Catalog{
list-style-type: none;
padding: 10px;
max-height: 300px;
margin-bottom: 5px;
overflow: hidden;
overflow-y:scroll;
text-align: left;
margin-top: 10px;
}
.Catalog::-webkit-scrollbar{
width:5px;
}
.Catalog::-webkit-scrollbar-track{
background:transparent;
}
.Catalog::-webkit-scrollbar-thumb{
background:${({ theme }) => theme.stats};
border-radius:12px;
}
.Catalog-title{
margin-top: 20px;
margin-bottom: 10px;
}
.Catalog-li{
cursor:pointer;
margin-bottom: 10px;
color: ${({ theme }) => theme.textTypeBox};
}
.Catalog-li-Activated{
cursor:default;
margin-bottom: 10px;
color: ${({ theme }) => theme.stats};
}
.Catalog-Button{
background-color: ${({ theme }) => theme.background};
color: ${({ theme }) => theme.textTypeBox};
}
.Catalog-Button-Activated{
background-color: ${({ theme }) => theme.background};
color: ${({ theme }) => theme.stats};
}
.Catalog-Selected{
background-color: ${({ theme }) => theme.background};
color: ${({ theme }) => theme.textTypeBox};
margin-top: 20px;
}
.select-chapter-title{
font-size: 16px;
}
.fade-element {
  opacity: 0;
  transition: opacity 500ms ease-in;
}
.fade-element:hover {
  opacity: 1;
  transition: opacity 500ms ease-in;
}
.primary-stats-title {
color: ${({ theme }) => theme.textTypeBox};
margin-block: 0;
margin-bottom: 6px;
font-size: 20px;
}
.primary-stats-value {
color: ${({ theme }) => theme.text};
margin-block: 0;
font-size: 36px;
}
.stats-title {
color: ${({ theme }) => theme.textTypeBox};
margin-block: 0;
margin-bottom: 6px;
font-weight: bold;
font-size: 16px;
}
.stats-value {
margin-block: 0;
}
.tooltip {
font-size: 14px;
line-height: 6px;
display: flex;
align-items: center;
gap: 8px;
}

/* Themed scrollbar */
*::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
*::-webkit-scrollbar-track {
  background: transparent;
}
*::-webkit-scrollbar-thumb {
  background: ${({ theme }) => theme.stats}44;
  border-radius: 3px;
}
*::-webkit-scrollbar-thumb:hover {
  background: ${({ theme }) => theme.stats}88;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .canvas {
    padding: 0.5rem;
  }
  .type-box, .type-box-chinese, .type-box-sentence {
    width: 90%;
    top: 5%;
  }
  .words {
    font-size: 22px;
  }
  .sentence-input-field, .sentence-display-field {
    font-size: 22px;
  }
  .wordcard-word-display-field {
    font-size: 40px;
    margin: 20px;
  }
  .wordcard-meaning-display-field {
    font-size: 16px;
    margin-top: 20px;
  }
  .bottomBar {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  .stats-overlay {
    padding: 8px;
  }
  .stats-chart {
    width: 95%;
  }
  .stats-header {
    grid-template-columns: 1fr;
  }
  .primary-stats-title {
    font-size: 16px;
  }
  .primary-stats-value {
    font-size: 36px;
  }
  .profile-area {
    right: 8px;
    top: 8px;
  }
  .namecard {
    display: none;
  }
}

@media (max-width: 480px) {
  .words {
    font-size: 18px;
  }
  .sentence-input-field, .sentence-display-field {
    font-size: 18px;
  }
  .stats-footer {
    flex-wrap: wrap;
    gap: 8px;
  }
  .primary-stats-value {
    font-size: 28px;
  }
}
`;
