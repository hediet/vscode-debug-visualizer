<?php

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
    array_push($graph["nodes"], ["id" => $id, "label" => $id]);

    // connects the node to a random edge
    $targetId = "" . random_int(1, $i - 1);
    array_push($graph["edges"], ["from" => $id, "to" => "" . $targetId]);

    xdebug_break();
}

echo "finished";
