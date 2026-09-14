import React, {Component} from "react";
import {observer, inject} from "mobx-react";

import {formatDoc} from "../../../utils/editorKeyEvents";
import {hotKeys} from "../../../utils/hotkey";

import "../common.css";

@inject("content")
@observer
class Format extends Component {
  handleFormat = () => {
    const {content} = this.props.content;
    formatDoc(content, this.props.content);
  };

  render() {
    return (
      <div id="nice-menu-format" className="nice-menu-item" onClick={this.handleFormat}>
        <span>
          <span className="nice-menu-flag" />
          <strong className="nice-menu-name important-mark">格式化文档</strong>
        </span>
        <span className="nice-menu-shortcut important-mark">{hotKeys.format}</span>
      </div>
    );
  }
}

export default Format;
