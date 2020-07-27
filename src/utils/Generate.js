	//import { clearCanvas } from "./ClearCanvas.svelte";
import { get } from "svelte/store";
import { spring } from "svelte/motion";
import { nodes, connections, next_node_id, next_cn_id, default_cn_weight, clearing_canvas } from "../model/State.js";
import Node from "../model/Node.js";
import Connection from "../model/Connection.js";

function getUsableBounds() {
	let canvas = document.getElementById("canvas");
	const actualBounds = [ canvas.clientWidth, canvas.clientHeight ];
	return [
		[actualBounds[0]/20 + 50, actualBounds[0]*19/20-250],
		[actualBounds[1]/20 + 90, actualBounds[1]*19/20-100],
	];
}

function getDistance({x:x1,y:y1},{x:x2,y:y2}) {
	return Math.sqrt(Math.pow(x2-x1,2) + Math.pow(y2-y1,2));
}

function sleepPromise(t) {
	return new Promise(_ => setTimeout(_, t))
}

function waitForEmpty() {
    return new Promise(
		(resolve, reject) => {
			(function check() {
				if (get(nodes).length === 0) return resolve();
				setTimeout(check, 100);
			})();
		}
	);
}

export async function clearCanvas() {
	clearing_canvas.set(true);
	nodes.update(
		arr =>
			arr.map(
				node => {
					node.kill = true;
					return node;
				}
			)
	);

	next_node_id.set(1);
	next_cn_id.set(1);

	await waitForEmpty();
	clearing_canvas.set(false);
	return;
}

export async function generatePseudoRandom() {
	await clearCanvas();
	const count = Math.floor((Math.random() * 15) + 20);
	const minradius = 90;
	const max_to_connect = 4;
	const node_time = 2000;
	const cn_approx_time = 5000;
	const node_delay = node_time / count;
	const cn_delay   = cn_approx_time / (count*3);

	const bounds = getUsableBounds();

	let nni = -1;
	const unsubscribenni = next_node_id.subscribe(val => nni = val);
	let ns = [];
	const unsubscribenodes = nodes.subscribe(val => ns = val);
	let nci = -1;
	const unsubscribenci = next_cn_id.subscribe(val => nci = val);
	let cns = [];
	const unsubscribecn = connections.subscribe(val => cns = val);
	let clearing = false;
	const unsubscribeclearingcanvas = clearing_canvas.subscribe(val => clearing = val);

	for (let i = 0; i < count; i++) {
		if (clearing) {
			unsubscribenni();
			unsubscribenodes();
			unsubscribenci();
			unsubscribecn();
			unsubscribeclearingcanvas();
			return;
		}
		let x, y;
		let attempts = 0;
		do {
			x = bounds[0][0] + Math.random() * (bounds[0][1] - bounds[0][0]);
			y = bounds[1][0] + Math.random() * (bounds[1][1] - bounds[1][0]);
			attempts++;
		} while (ns.find(node => getDistance(get(node.posSpringA),{x,y}) < minradius) && attempts < 20);

		nodes.update(
			arr => [
				...arr,
				new Node(
					nni,
					spring({ x, y }),
					spring({ x, y }),
					spring(0),
					spring(0)
				)
			]
		);
		next_node_id.update(val => val+1);
		await sleepPromise(node_delay);
	}
	unsubscribenni();


	for (let i = 0; i < ns.length; i++) {
		const no_to_connect = Math.random()*max_to_connect +1;

		for (let j = 1; j < no_to_connect && j < ns.length; j++) { // (first element is 0 away)
			if (clearing) {
				unsubscribenodes();
				unsubscribenci();
				unsubscribecn();
				unsubscribeclearingcanvas();
				return;
			}

			const sortedByDistance = ns.slice().sort( // sort by distance away
				(a,b) => getDistance(get(a.posSpringA), get(ns[i].posSpringA)) - getDistance(get(b.posSpringA), get(ns[i].posSpringA))
			);
				
			const cn_weight = Math.floor(Math.random()*10+1);
			const cn_direction = Math.floor(Math.random()*3);

			const idA = ns[i].id, idB = sortedByDistance[j].id;
			if (!cns.find(cn => (cn.idA === idA && cn.idB === idB) || (cn.idB === idA && cn.idA === idB)) && !sortedByDistance[j].kill) {
				connections.update(
					arr => [
						...arr,
						new Connection(
							nci,
							idA,
							idB,
							cn_weight,
							cn_direction
						)
					]
				);
				next_cn_id.update(val => val+1);
			}
			await sleepPromise(cn_delay);
		}
	}

	unsubscribenodes();
	unsubscribenci();
	unsubscribecn();
	unsubscribeclearingcanvas();
}

export async function generatePerfect() {
	await clearCanvas();
	const count = Math.floor((Math.random() * 15) + 4);
	const max_to_connect = 4;
	const node_time = 2000;
	const cn_time = 5000;
	const node_delay = node_time / count;
	const cn_delay   = 2*cn_time / (count*(count+1));

	const bounds = getUsableBounds();
	const radius = Math.min(bounds[0][1]-bounds[0][0], bounds[1][1]-bounds[1][0])*0.4;
	const cx = (bounds[0][0]+bounds[0][1])/2;
	const cy = (bounds[1][0]+bounds[1][1])/2;
	const dt = 2*Math.PI/count;

	let nni = -1;
	const unsubscribenni = next_node_id.subscribe(val => nni = val);
	let ns = [];
	const unsubscribenodes = nodes.subscribe(val => ns = val);
	let nci = -1;
	const unsubscribenci = next_cn_id.subscribe(val => nci = val);
	let cns = [];
	const unsubscribecn = connections.subscribe(val => cns = val);
	let clearing = false;
	const unsubscribeclearingcanvas = clearing_canvas.subscribe(val => clearing = val);

	for (let i = 0; i < count; i++) {
		if (clearing) {
			unsubscribenni();
			unsubscribenodes();
			unsubscribenci();
			unsubscribecn();
			unsubscribeclearingcanvas();
			return;
		}
		const x = cx + radius*Math.sin(i*dt);
		const y = cy - radius*Math.cos(i*dt);

		nodes.update(
			arr => [
				...arr,
				new Node(
					nni,
					spring({ x, y }),
					spring({ x, y }),
					spring(0),
					spring(0)
				)
			]
		);
		next_node_id.update(val => val+1);
		await sleepPromise(node_delay);
	}
	unsubscribenni();


	for (let i = 0; i < ns.length; i++) {
		for (let j = i+1; j < ns.length; j++) {
			if (clearing) {
				unsubscribenni();
				unsubscribenodes();
				unsubscribenci();
				unsubscribecn();
				unsubscribeclearingcanvas();
				return;
			}

			const cn_weight = Math.floor(Math.random()*10+1);
			const cn_direction = Math.floor(Math.random()*3);

			const idA = ns[i].id, idB = ns[j].id;
			if (!cns.find(cn => (cn.idA === idA && cn.idB === idB) || (cn.idB === idA && cn.idA === idB)) && !ns[i].kill && !ns[j].kill) {
				connections.update(
					arr => [
						...arr,
						new Connection(
							nci,
							idA,
							idB,
							cn_weight,
							cn_direction
						)
					]
				);
				next_cn_id.update(val => val+1);
			}
			await sleepPromise(cn_delay);
		}
	}

	unsubscribenni();
	unsubscribenodes();
	unsubscribenci();
	unsubscribecn();
	unsubscribeclearingcanvas();
}

/*export async function generateBinaryTree() {
	await clearCanvas();
	const count = Math.floor((Math.random() * 15) + 4);
	const max_to_connect = 4;
	const node_time = 2000;
	const cn_time = 5000;
	const node_delay = node_time / count;
	const cn_delay   = 2*cn_time / (count*(count+1));

	const bounds = getUsableBounds();
	const radius = Math.min(bounds[0][1]-bounds[0][0], bounds[1][1]-bounds[1][0])*0.4;
	const cx = (bounds[0][0]+bounds[0][1])/2;
	const cy = (bounds[1][0]+bounds[1][1])/2;
	const dt = 2*Math.PI/count;

	let nni = -1;
	const unsubscribenni = next_node_id.subscribe(val => nni = val);
	let ns = [];
	const unsubscribenodes = nodes.subscribe(val => ns = val);
	let nci = -1;
	const unsubscribenci = next_cn_id.subscribe(val => nci = val);
	let cns = [];
	const unsubscribecn = connections.subscribe(val => cns = val);
	let clearing = false;
	const unsubscribeclearingcanvas = clearing_canvas.subscribe(val => clearing = val);

	for (let i = 0; i < count; i++) {
		if (clearing) {
			unsubscribenni();
			unsubscribenodes();
			unsubscribenci();
			unsubscribecn();
			unsubscribeclearingcanvas();
			return;
		}
		const x = cx + radius*Math.sin(i*dt);
		const y = cy - radius*Math.cos(i*dt);

		nodes.update(
			arr => [
				...arr,
				new Node(
					nni,
					spring({ x, y }),
					spring({ x, y }),
					spring(0),
					spring(0)
				)
			]
		);
		next_node_id.update(val => val+1);
		await sleepPromise(node_delay);
	}
	unsubscribenni();


	for (let i = 0; i < ns.length; i++) {
		for (let j = i+1; j < ns.length; j++) {
			if (clearing) {
				unsubscribenni();
				unsubscribenodes();
				unsubscribenci();
				unsubscribecn();
				unsubscribeclearingcanvas();
				return;
			}

			const cn_weight = Math.floor(Math.random()*10+1);
			const cn_direction = Math.floor(Math.random()*3);

			const idA = ns[i].id, idB = ns[j].id;
			if (!cns.find(cn => (cn.idA === idA && cn.idB === idB) || (cn.idB === idA && cn.idA === idB)) && !ns[i].kill && !ns[j].kill) {
				connections.update(
					arr => [
						...arr,
						new Connection(
							nci,
							idA,
							idB,
							cn_weight,
							cn_direction
						)
					]
				);
				next_cn_id.update(val => val+1);
			}
			await sleepPromise(cn_delay);
		}
	}

	unsubscribenni();
	unsubscribenodes();
	unsubscribenci();
	unsubscribecn();
	unsubscribeclearingcanvas();
}*/
