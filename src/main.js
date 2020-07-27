import App from './App.svelte';

const app = new App({
	target: document.body,
});

document.body.style.padding = "0";
document.body.style.margin = "0";
document.body.style.boxSizing = "border-box";
document.body.style.width = "100vw";
document.body.style.height = "100vh";

export default app;