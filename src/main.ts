import "svelte"
import App from "./App.svelte"

import "./base.css";

const app = new App({
  target: document.body,
})

export default app