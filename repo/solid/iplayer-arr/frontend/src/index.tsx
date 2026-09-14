import { render } from "solid-js/web";
import "./styles.css";
import App from "./App";
import { installRbProbe } from "./rb/probe";

installRbProbe();

render(() => <App />, document.getElementById("root")!);
