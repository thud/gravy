<script lang="ts">
    import { slide } from 'svelte/transition';
    import { expoInOut } from 'svelte/easing';
    import { algo_to_visualise, last_generated, colors } from '../model/State';

    let gen_title = '',
        gen_desc = '',
        gen_link = '',
        gen_link_url = '';

    const gen_texts = [
        [
            'Undirected Graph',
            'Graph whose edges are all bidirectional.',
            'Wikipedia',
            'https://en.wikipedia.org/wiki/Graph_(discrete_mathematics)#Undirected_graph',
        ],
        [
            'Directed Graph',
            'Graph whose edges have an orientation.',
            'Wikipedia',
            'https://en.wikipedia.org/wiki/Directed_graph',
        ],
        [
            'Oriented Graph',
            'Graph whose edges have orientations that are strictly never bidirectional.',
            'Wikipedia',
            'https://en.wikipedia.org/wiki/Orientation_(graph_theory)#Oriented_graphs',
        ],
        [
            'Directed Acyclic Graph (DAG)',
            'Oriented Graph with exactly zero cycles',
            'Wikipedia',
            'https://en.wikipedia.org/wiki/Directed_acyclic_graph',
        ],
        [
            'Complete Graph',
            'Simple Undirected Graph in which every pair of distinct vertices is connected by a unique edge',
            'Wikipedia',
            'https://en.wikipedia.org/wiki/Complete_graph',
        ],
        [
            'Binary Search Tree',
            "Rooted Binary Tree whose internal nodes each store a key greater than all the keys in the node's left subtree and less than those in its right subtree.",
            'Wikipedia',
            'https://en.wikipedia.org/wiki/Binary_search_tree',
        ],
        [
            'Tree',
            'Undirected graph in which any two vertices are connected by exactly one path, or equivalently a connected acyclic undirected graph.',
            'Wikipedia',
            'https://en.wikipedia.org/wiki/Tree_(graph_theory)',
        ],
        [
            'Out-Tree',
            'Directed Rooted Tree in which all edges are directed away from the root. (Arborescence)',
            'Wikipedia',
            'https://en.wikipedia.org/wiki/Arborescence_(graph_theory)',
        ],
        [
            'In-Tree',
            'Directed Rooted Tree in which all edges are directed towards the root. (Anti-Arborescence)',
            'Wikipedia',
            'https://en.wikipedia.org/wiki/Arborescence_(graph_theory)',
        ],
    ];

    $: if ($last_generated !== -1) {
        [gen_title, gen_desc, gen_link, gen_link_url] = gen_texts[
            $last_generated
        ];
    } else {
        [gen_title, gen_desc, gen_link, gen_link_url] = [
            gen_title,
            gen_desc,
            gen_link,
            gen_link_url,
        ].fill('');
    }

    let algo_title = '',
        algo_desc = '',
        algo_link = '',
        algo_link_url = '';

    const algo_texts = [
        [
            'Depth First Search',
            'Graph traversal/search which starts at the root node (arbitrary if no root) and explores as far as possible along each branch before backtracking. It does not always produce the shortest path between nodes.',
            'Wikipedia',
            'https://en.wikipedia.org/wiki/Depth-first_search',
        ],
        [
            'Breadth First Search',
            'Graph traversal/search which starts at the root node (arbitrary if no root), and explores all of the neighbor nodes at the present depth prior to moving on to the nodes at the next depth level. It does not always produce the shortest path between nodes.',
            'Wikipedia',
            'https://en.wikipedia.org/wiki/Depth-first_search',
        ],
        [
            "Dijkstra's Algorithm",
            'Graph search which starts at the tree root (arbitrary if no root), and greedily explores the next available node of lowest cost. Cost is defined as the sum of edge weights travelled through on path to reach a node from the start node. It guarantees the shortest path between root and any other node.',
            'Wikipedia',
            'https://en.wikipedia.org/wiki/Dijkstra%27s_algorithm',
        ],
        [
            'Bidirectional Dijkstra',
            "Dijkstra's algorithm with the end node included in initial state. It guarantees the shortest path between the start and end node.",
            'Wikipedia',
            'https://en.wikipedia.org/wiki/Bidirectional_search',
        ],
        [
            'A* ("A-Star")',
            'Graph search which starts at a given start node and greedily explores the next available node of lowest cost. Cost is defined as the sum of edge weights travelled through on path to reach a node from the start node plus the result of some heuristic function (here distance, weighted arbitrarily). It does not always produce the shortest path between nodes.',
            'Wikipedia',
            'https://en.wikipedia.org/wiki/A*_search_algorithm',
        ],
        [
            'Topological Sort (Depth First Search Method)',
            'Sort graph nodes in order such that for each directed edge <em>uv</em> from vertex <em>u</em> to <em>v</em>, <em>u</em> is visited before <em>v</em>. Sorting is performed with one or more Depth First Searches. (must be a DAG to succeed)',
            'Wikipedia',
            'https://en.wikipedia.org/wiki/Topological_sorting',
        ],
        [
            "Topological Sort (Kahn's Algorithm)",
            'Sort graph nodes in order such that for each directed edge <em>uv</em> from vertex <em>u</em> to <em>v</em>, <em>u</em> is visited before <em>v</em>. Sorting is performed by maintaining a set of nodes with no incoming edges and then gradually pruning tree until all nodes have been visited. (must be a DAG to succeed)',
            'Wikipedia',
            'https://en.wikipedia.org/wiki/Topological_sorting',
        ],
        [
            "Kosaraju's Algorithm",
            'Algorithm which finds Strongly Connected Components (SCCs) in a graph with two stages of Depth First Searches.',
            'Wikipedia',
            'https://en.wikipedia.org/wiki/Kosaraju%27s_algorithm',
        ],
        [
            "Tarjan's Algorithm",
            'Algorithm which finds Strongly Connected Components (SCCs) in a single round of Depth First Search.',
            'Wikipedia',
            "https://en.wikipedia.org/wiki/Tarjan's_strongly_connected_components_algorithm",
        ],
        [
            'Hamiltonian Cycle (Backtracking)',
            'Depth First Search with backtracking to try to find a Hamiltonian Cycle (path which visits all nodes exactly once and ends at first node). This runs in O(n!) time meaning that it will likely only run smoothly on small graphs.',
            'Wikipedia',
            'https://en.wikipedia.org/wiki/Hamiltonian_path',
        ],
        [
            'Travelling Salesman (Backtracking)',
            'Depth First Search with backtracking to try to find all Hamiltonian Cycles and takes the cycle with minimum cost. This runs in O(n!) time meaning that it will likely only run smoothly on small graphs.',
            'Wikipedia',
            'https://en.wikipedia.org/wiki/Travelling_salesman_problem',
        ],
    ];

    $: if ($algo_to_visualise !== -1) {
        [algo_title, algo_desc, algo_link, algo_link_url] = algo_texts[
            $algo_to_visualise
        ];
    } else {
        [algo_title, algo_desc, algo_link, algo_link_url] = [
            algo_title,
            algo_desc,
            algo_link,
            algo_link_url,
        ].fill('');
    }
</script>

<style>
    @media only screen and (max-width: 750px) {
        .tooltip-container {
            display: none;
        }
    }

    .tooltip-container {
        position: absolute;
        color: white;
        padding: 0 1.9rem;
        text-align: center;
        bottom: 5%;
        left: min(calc(5vw + 3.1rem), 10vw);
        right: calc(5% + 18.75rem);
        box-sizing: border-box;
        overflow: ellipsis;
    }

    /*.gen-text,
    .algo-text {
    }*/

    .gen-text {
        margin-bottom: 0.25rem;
    }

    .title {
        font-weight: 600;
    }

    a {
        text-decoration: underline;
        font-weight: 600;
    }
</style>

<div class="tooltip-container">
    {#if gen_title}
        <div
            class="gen-text"
            out:slide={{ duration: 500, easing: expoInOut, delay: 0 }}
            in:slide={{ duration: 300, easing: expoInOut, delay: 0 }}>
            <span class="title">{gen_title}</span>
            -
            {@html gen_desc}
            <a
                href={gen_link_url}
                style="color:{$colors.nord9}"
                target="_blank"
                rel="noopener noreferrer">
                {gen_link}
            </a>
        </div>
    {/if}
    {#if algo_title}
        <div
            class="algo-text"
            out:slide={{ duration: 500, easing: expoInOut, delay: 0 }}
            in:slide={{ duration: 300, easing: expoInOut, delay: 0 }}>
            <span class="title">{algo_title}</span>
            -
            {@html algo_desc}
            <a
                href={algo_link_url}
                style="color:{$colors.nord9}"
                target="_blank"
                rel="noopener noreferrer">
                {algo_link}
            </a>
        </div>
    {/if}
</div>
