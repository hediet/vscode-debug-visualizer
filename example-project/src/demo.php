<?php

for ($i = 0; $i < 100; $i++) {

    // { kind: { graph: true }, nodes: [ { id: "1", label: "1" }, { id: "2", label: "2" } ], edges: [{ from: "1", to: "2", label: "edge" }]}
    $data = json_encode(array(
        "kind" => array("graph" => true),
        "nodes" => [
            array("id" => "1", "label" => "1"),
            array("id" => "2", "label" => "2"),
        ],
        "edges" => [
            array("from" => "1", "to" => "2", "label" => "edge")
        ]
    ));

    echo "test" . $i;
}
