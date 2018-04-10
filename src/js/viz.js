import Springy from 'springy';
import * as THREE from 'three';
import './controls/TrackballControls';
import NodeGraph from './nodeGraph';
import Stats from '../../node_modules/stats.js/src/Stats';
import Glow from './libs/GlowMesh';

// Springy.js Specific values
const SpringyStiffness = 200.0;
const SpringyNodeRepulsion = 400.0;
const SpringyDamping = 0.5;

// Three.js Specific values
const NodeSize = 0.5;
const NodeDefaultColor = 0x4286f4;
const NodeDefaultGlowColor = 0x0c62ff;
const EdgeDefaultColor = 0xbc1d14;
const NodeResolution = 16;
const RenderNodes = false;
const RenderNodeGlow = true;
const RenderEdges = true;
const CameraPositionZ = 80.0;

// Used for stats readout.
const stats = new Stats();

module.exports = function (commitHistory) {
    console.info('Viz Loaded.')

    // Load our data set.
    if(commitHistory){
        commitHistory.then(commits =>{
            console.debug('Commits:', commits);
        }).catch(reason =>{
            console.error('Error loading dataset:', reason);
        });
    }
    var nodeGraph = NodeGraph(200);
    console.info('NodeGraph has been loaded.')

    // Create a SpringyGraph.
    var graph = createSpringyGraph(nodeGraph);

    // Setup Renderers for both Springy.js and Three.js
    var springyRenderer = setupSpringyRender(graph);
    var threeRenderer = setupThreeRenderer(graph);
    window.graph = graph;

    // Setup our stats panel.
    stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    var statsPane = document.getElementById('StatsPane');
    statsPane.appendChild(stats.dom);
    stats.domElement.removeAttribute('style');

    // Start animation loops.
    runAnimation(springyRenderer, threeRenderer);
};


function createSpringyGraph(nodeGraph) {
    var graph = new Springy.Graph();
    nodeGraph.traverse(n => {
        // Create node and node geometry.
        var viz3dNode = create3dNode();
        var geometry = { edges: [], edgeVectors: [], node: viz3dNode }
        var nodeData = { label: n.data.name, geometry: geometry, graphNode: n }
        var newNode = graph.newNode(nodeData);
        n.springyNode = newNode;
    });

    graph.nodes.forEach(n => {
        if (n.data.graphNode.parent != undefined) {
            var parent = n.data.graphNode.parent.springyNode;
            if (parent) {
                var viz3dEdge = create3dEdge();
                n.data.geometry.edgeVectors.push(viz3dEdge.vizAttrs.childVector);
                n.data.geometry.edges.push(viz3dEdge);
                parent.data.geometry.edgeVectors.push(viz3dEdge.vizAttrs.parentVector);
                parent.data.geometry.edges.push(viz3dEdge);
                graph.newEdge(parent, n);
            } else {
                // Root Node ?
            }
        }
    });

    return graph;
}

function create3dNode() {
    // Create node geometry.
    var geometry = new THREE.SphereGeometry(NodeSize, NodeResolution, NodeResolution);
    var material = new THREE.MeshBasicMaterial({ color: NodeDefaultColor });
    var sphere = new THREE.Mesh(geometry, material);
    var glowMesh = new Glow.GeometricGlowMesh(sphere);

    // Create node glow geometry.
    var insideUniforms = glowMesh.insideMesh.material.uniforms;
    insideUniforms.glowColor.value.set(NodeDefaultGlowColor);
    var outsideUniforms = glowMesh.outsideMesh.material.uniforms;
    outsideUniforms.glowColor.value.set(NodeDefaultGlowColor);

    // Add some custom properties.
    sphere.vizAttrs = { glowMesh: glowMesh };


    return sphere;
}


function createParticleNode() {
    // TODO needs refactoring, not in use.
    var geometry = new THREE.Geometry()
    var texture = THREE.ImageUtils.loadTexture("images/particle.png")
    var material = new THREE.ParticleBasicMaterial({ color: NodeDefaultColor, size: NodeSize, map: texture, blending: THREE.AdditiveBlending, transparent: true });
    var particle = new THREE.Vertex(new THREE.Vector3(0, 0, 0));
    return particle;
}

function create3dEdge() {
    var edgeMaterial = new THREE.LineBasicMaterial({ color: EdgeDefaultColor });
    var edgeGeometry = new THREE.Geometry();
    var parentVector = new THREE.Vector3(0, 0, 0)
    var childVector = new THREE.Vector3(0, 0, 0)
    edgeGeometry.vertices.push(parentVector);
    edgeGeometry.vertices.push(childVector);
    var edge = new THREE.Line(edgeGeometry, edgeMaterial);

    // Add some custom attributes
    edge.vizAttrs = { parentVector: parentVector, childVector: childVector };
    return edge;
}


function setupThreeRenderer(graph) {
    var scene = new THREE.Scene();
    // Camera Setup.
    var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100000);
    var controls = new THREE.TrackballControls(camera);
    controls.noRotate = true;

    camera.position.z = CameraPositionZ;

    // Three.js Renderer setup.
    var threeRenderer = new THREE.WebGLRenderer();
    threeRenderer.setSize(window.innerWidth, window.innerHeight);
    var renderPane = document.getElementById('RenderPane');
    renderPane.appendChild(threeRenderer.domElement);

    // Add all of our geometry.
    graph.nodes.forEach(n => {
        if (RenderNodes) {
            scene.add(n.data.geometry.node);
        }
        if (RenderNodeGlow) {
            scene.add(n.data.geometry.node.vizAttrs.glowMesh.object3d);
        }
        if (RenderEdges) {
            n.data.geometry.edges.forEach(edge => {
                scene.add(edge);
            });
        }
    });

    // Attach some custom properties.
    threeRenderer.vizAttrs = { scene: scene, camera: camera, controls: controls };

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
            // I am updating verticies with nodes.
        },
        function drawNode(node, p) {
            // Get positional data from Springyjs
            var x = p.x
            var y = p.y

            // Update nodes.
            if (RenderNodes) {
                node.data.geometry.node.position.x = p.x;
                node.data.geometry.node.position.y = p.y;
            }
            // Update Glow Meshes
            if (RenderNodeGlow) {
                node.data.geometry.node.vizAttrs.glowMesh.object3d.position.x = p.x;
                node.data.geometry.node.vizAttrs.glowMesh.object3d.position.y = p.y;
            }
            // Update edges.
            if (RenderEdges) {
                node.data.geometry.edgeVectors.forEach(vector => {
                    vector.x = p.x;
                    vector.y = p.y;
                });
                node.data.geometry.edges.forEach(edge => {
                    edge.geometry.verticesNeedUpdate = true;
                });
            }
        }
    );

    // Attach some custom properties.
    springyRenderer.vizAttrs = { animationStarted: false };

    return springyRenderer;
}


// Main animation loop.
function runAnimation(springyRenderer, threeRenderer) {
    stats.begin();
    requestAnimationFrame(runAnimation.bind(null, springyRenderer, threeRenderer));
    threeRenderer.render(threeRenderer.vizAttrs.scene, threeRenderer.vizAttrs.camera);
    threeRenderer.vizAttrs.controls.update();
    if (springyRenderer.vizAttrs.animationStarted != true) {
        springyRenderer.vizAttrs.animationStarted = true;
        console.info('Starting Springy Animiation Loop.');
        springyRenderer.start();
    }
    stats.end();
}