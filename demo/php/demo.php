<?php

// Install php, xdebug and the php debug extension for VS Code
// (https://marketplace.visualstudio.com/items?itemName=felixfbecker.php-debug).

// The Debug Visualizer has no support for PHP data extractors yet,
// so to visualize data, your value must be a valid JSON string representing the data.
// See readme for supported data schemas.

$graph = [
    "kind" => ["graph" => true],
    "nodes" => [
        ["id" => "1", "label" => "1"]
    ],
    "edges" => []
];
// Visualize "$visualize()"
$visualize = function () use (&$graph) {
    return json_encode($graph);
};

for ($i = 2; $i < 100; $i++) {
    // add a node
    $id = "" . $i;
    array_push($graph["nodes"],
        ["id" => $id, "label" => $id]);
    // connects the node to a random edge
    $targetId = "" . random_int(1, $i - 1);
    array_push($graph["edges"],
        ["from" => $id, "to" => "" . $targetId]);
}

echo "finished";
