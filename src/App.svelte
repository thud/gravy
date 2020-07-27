<script>
  import Head from "./components/Head.svelte";
  import NavBar from "./components/NavBar.svelte";
  import GraphCanvas from "./components/GraphCanvas.svelte";
  import GithubButton from "./components/GithubButton.svelte";
</script>

<style>
  main {
    text-align: center;
    margin: 0;
    box-sizing: border-box;
    width: 100vw;
    height: 100vh;
  }
</style>

<main>
  <Head />
  <NavBar />
  <GithubButton />
  <GraphCanvas />
</main>
