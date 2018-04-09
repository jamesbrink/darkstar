import Springy from 'springy';
import * as THREE from 'three';
import './controls/OrbitControls';
import NodeGraph from './nodeGraph';
import Stats from '../../node_modules/stats.js/src/Stats';

// Springy.js Specific values
const SpringyStiffness = 200.0;
const SpringyNodeRepulsion = 200.0;
const SpringyDamping = 0.2;

// Three.js Specific values
const NodeSize = 0.3;
const NodeDefaultColor = 0x4286f4;
const EdgeDefaultColor = 0xbc1d14;
const NodeResolution = 4;

const CameraPositionZ = 50.0;

const stats = new Stats();

module.exports = function () {
    console.log('Viz Loaded.')

    // Load our data set.
    var nodeGraph = NodeGraph(100);
    console.log('NodeGraph has been loaded.')

    // Create a SpringyGraph.
    var graph = createSpringyGraph(nodeGraph);

    // Setup Renderers for both Springy.js and Three.js
    var springyRenderer = setupSpringyRender(graph);
    var threeRenderer = setupThreeRenderer(graph);
    window.graph = graph;

    
    stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild( stats.dom );

    // Start animation loops.
    runAnimation(springyRenderer, threeRenderer);
};


function createSpringyGraph(nodeGraph) {
    var graph = new Springy.Graph();
    nodeGraph.traverse(n => {
        // Create node and node geometry.
        var viz3dNode = create3dNode();
        var geometry = { edges: [], edgeVectors: [], node: viz3dNode }
        var nodeData = { label: n.data.name, geometry: geometry, graphNode: n}
        var newNode = graph.newNode(nodeData);
        n.springyNode = newNode;
    });

    graph.nodes.forEach(n =>{
        if (n.data.graphNode.parent != undefined){
            var parent = n.data.graphNode.parent.springyNode;
            if(parent){
                var viz3dEdge = create3dEdge();
                n.data.geometry.edgeVectors.push(viz3dEdge.vizAttrs.childVector);
                n.data.geometry.edges.push(viz3dEdge);
                parent.data.geometry.edgeVectors.push(viz3dEdge.vizAttrs.parentVector);
                parent.data.geometry.edges.push(viz3dEdge);
                graph.newEdge(parent, n);
            }else{
                // Root Node ?
            }
        }
    });

    return graph;
}

function create3dNode() {
    var geometry = new THREE.SphereGeometry(NodeSize, NodeResolution, NodeResolution);
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
    var controls = new THREE.OrbitControls( camera );
    
    camera.position.z = CameraPositionZ;

    // Three.js Renderer setup.
    var threeRenderer = new THREE.WebGLRenderer();
    threeRenderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(threeRenderer.domElement);

    // Add all of our graph nodes.
    graph.nodes.forEach(n =>{
        scene.add(n.data.geometry.node);
        n.data.geometry.edges.forEach(edge =>{
            scene.add(edge);
        });
    });

    // Attach some custom properties.
    threeRenderer.vizAttrs = { scene: scene, camera: camera , controls: controls};

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
            node.data.geometry.edgeVectors.forEach(vector => {
                vector.x = p.x;
                vector.y = p.y;
            });
            node.data.geometry.edges.forEach(edge =>{
                edge.geometry.verticesNeedUpdate = true;
            });
        }
    );
    
    // Attach some custom properties.
    springyRenderer.vizAttrs = { animationStarted: false };

    return springyRenderer;
}

function runAnimation(springyRenderer, threeRenderer) {
    stats.begin();
    requestAnimationFrame(runAnimation.bind(null, springyRenderer, threeRenderer));
    // controls.update();
    threeRenderer.render(threeRenderer.vizAttrs.scene, threeRenderer.vizAttrs.camera);
    threeRenderer.vizAttrs.controls.update();
    if (springyRenderer.vizAttrs.animationStarted != true) {
        springyRenderer.vizAttrs.animationStarted = true;
        console.log('Starting Springy Animiation Loop.');
        springyRenderer.start();
    }
    stats.end();
}