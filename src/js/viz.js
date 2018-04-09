import Springy from 'springy';
import * as THREE from 'three';
import NodeGraph from './nodeGraph';

// Springy.js Specific values
const SpringyStiffness = 200.0;
const SpringyNodeRepulsion = 20.0;
const SpringyDamping = 0.4;

// Three.js Specific values
const NodeSize = 0.3;
const NodeDefaultColor = 0x4286f4;
const EdgeDefaultColor = 0xbc1d14;

const CameraPositionZ = 200.0;


module.exports = function () {
    console.log('Viz Loaded.')

    // Load our data set.
    var nodeGraph = NodeGraph();
    console.log('NodeGraph has been loaded.')

    // Create a SpringyGraph.
    var graph = createSpringyGraph(nodeGraph);

    // Setup Renderers for both Springy.js and Three.js
    var springyRenderer = setupSpringyRender(graph);
    var threeRenderer = setupThreeRenderer(graph);

    // Start animation loops.
    runAnimation(springyRenderer, threeRenderer);
};


function createSpringyGraph(nodeGraph) {
    var graph = new Springy.Graph();
    nodeGraph.traverse(n => {
        // Create node and node geometry.
        var viz3dNode = create3dNode();
        var geometry = { edges: [], node: viz3dNode }
        var nodeData = { label: n.data.name, geometry: geometry }
        var newNode = graph.newNode(nodeData);
        // Create edges and edge geometry
        // TODO
    });
    return graph;
}

function create3dNode() {
    var geometry = new THREE.SphereGeometry(NodeSize, 32, 32);
    var material = new THREE.MeshBasicMaterial({ color: NodeDefaultColor });
    var sphere = new THREE.Mesh(geometry, material);
    return sphere;
}

function createParticleNode(){
    // TODO needs refactoring, not in use.
    var geometry = new THREE.Geometry()
    var texture = THREE.ImageUtils.loadTexture("images/particle.png")
    var material = new THREE.ParticleBasicMaterial({ color: NodeDefaultColor , size: NodeSize, map: texture, blending:THREE.AdditiveBlending, transparent: true });
    var particle = new THREE.Vertex(new THREE.Vector3(0, 0, 0));
    return particle;
}

function create3dEdge() {
    var edgeMaterial = new THREE.LineBasicMaterial( { color: EdgeDefaultColor } );
    var edgeGeometry = new THREE.Geometry();
    var parentVector = new THREE.Vector3(0, 0, 0)
    var childVector = new THREE.Vector3(0, 0, 0)
    edgeGeometry.vertices.push(parentVector);
    edgeGeometry.vertices.push(childVector);
    var edge = new THREE.Line(edgeGeometry, edgeMaterial);

    // Add some custom attributes
    edge.vizAttrs = {parentVector: parentVector, childVector: childVector};
    return edge;
}


function setupThreeRenderer(graph) {
    var scene = new THREE.Scene();
    // Camera Setup.
    var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100000);
    camera.position.z = CameraPositionZ;

    // Three.js Renderer setup.
    var threeRenderer = new THREE.WebGLRenderer();
    threeRenderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(threeRenderer.domElement);

    // Add all of our graph nodes.
    graph.nodes.forEach(n =>{
        scene.add(n.data.geometry.node);
    })

    // Attach some custom properties.
    threeRenderer.vizAttrs = { scene: scene, camera: camera };

    return threeRenderer;
}

function setupSpringyRender(graph) {
    // Setup Springy Layout
    var layout = new Springy.Layout.ForceDirected(graph, SpringyStiffness, SpringyNodeRepulsion, SpringyDamping);

    // Setup Springy Renderer
    var springyRenderer = new Springy.Renderer(layout,
        function clear() {
            // code to clear screen
            // TODO when do i need to call this?
        },
        function drawEdge(edge, p1, p2) {
            // draw an edge
            // TODO move verticies from below to here?
        },
        function drawNode(node, p) {
            var x = p.x
            var y = p.y
            node.data.geometry.node.position.x = p.x;
            node.data.geometry.node.position.y = p.y;
            node.data.geometry.edges.forEach(edge => {
                edge.x = p.x;
                edge.y = p.y;
                edge.geometry.verticesNeedUpdate = true;
            });
        }
    );
    // Attach some custom properties.
    springyRenderer.vizAttrs = { animationStarted: false };

    return springyRenderer;
}

function runAnimation(springyRenderer, threeRenderer) {
    requestAnimationFrame(runAnimation.bind(null, springyRenderer, threeRenderer));
    // controls.update();
    threeRenderer.render(threeRenderer.vizAttrs.scene, threeRenderer.vizAttrs.camera);
    if (springyRenderer.vizAttrs.animationStarted != true) {
        springyRenderer.vizAttrs.animationStarted = true;
        console.log('Starting Springy Animiation Loop.');
        springyRenderer.start();
    }
}