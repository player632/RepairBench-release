import React, {Component} from "react";
import ImageDialog from "../component/Dialog/ImageDialog";
import LinkDialog from "../component/Dialog/LinkDialog";
import FormDialog from "../component/Dialog/FormDialog";
import SitDownDialog from "../component/Dialog/SitDownDialog";

class Dialog extends Component {
  render() {
    return (
      <div>
        <ImageDialog />
        <LinkDialog />
        <FormDialog />
        <SitDownDialog />
      </div>
    );
  }
}

export default Dialog;
