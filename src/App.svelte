<script lang="ts">
    import NavBar from './components/NavBar.svelte';
    import GraphCanvas from './components/GraphCanvas.svelte';
    import GithubButton from './components/GithubButton.svelte';
    import Toolbar from './components/Toolbar.svelte';
    import Tooltip from './components/Tooltip.svelte';
    import Tutorial from './components/Tutorial.svelte';
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
    <GraphCanvas />
    <NavBar />
    <GithubButton />
    <Toolbar />
    <Tooltip />
    <Tutorial />
</main>
