import data from './data';

module.exports = function () {
    var rootNode = new Node('/');
    var fileList = getUniqueFiles(data);
    fileList.forEach(file =>{
        rootNode.add(file);
    });
    return rootNode;
};


function Node(data) {
    this.data = data;
    this.parent = null;
    this.children = [];
}

Node.prototype.add = function (filePath) {
    var nodes = filePath.split('/').splice(1);
    var parent = this;;
    var nodeExists = false;
    var pathLength = nodes.length;
    var pathDepth = 0;
    nodes.forEach(n => {
        pathDepth += 1;
        this.traverse(function (node) {
            if (node.data == n && node.parent == parent) {
                nodeExists = true;
                parent = node;
            }
        });
        if (!nodeExists || pathDepth == pathLength) {
            var newNode = new Node(n);
            parent.addChild(newNode);
            if (pathDepth != pathLength) {
                parent = newNode;
            }
        }
        nodeExists = false;
    });
};

Node.prototype.traverse = function (callback) {
    (function recurse(currentNode) {
        for (var i = 0, length = currentNode.children.length; i < length; i++) {
            recurse(currentNode.children[i]);
        }
        callback(currentNode);
    })(this);
};

Node.prototype.addChild = function (node) {
    node.parent = this;
    this.children.push(node);
};

function arrayContains(value, array) {
    return (array.indexOf(value) > -1);
}

function getUniqueFiles(commits) {
    var uniqueFiles = [];
    commits.forEach(commit => {
        if (!arrayContains(commit.file, uniqueFiles)) {
            uniqueFiles.push(commit.file);
        }
    });
    return (uniqueFiles)
}



