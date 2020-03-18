package main

import (
	"encoding/json"
	"math/rand"
	"strconv"
	"time"
)

// If you want to visualize large data structures,
// you need to increase Delve's maxStringLen.
// (See here https://github.com/microsoft/vscode-go/issues/868 for more info)
// You can do this by adding the following configuration to your launch.json:
// "dlvLoadConfig": {
//     "followPointers": true,
//     "maxVariableRecurse": 1,
//     "maxStringLen": 5000,
//     "maxArrayValues": 64,
//     "maxStructFields": -1
// }
// For debugging tests, you can set the maxStringLen in settings.json like this:
// "go.delveConfig": {
//     "dlvLoadConfig": {
//         "followPointers": true,
//         "maxVariableRecurse": 1,
//         "maxStringLen": 5000,
//         "maxArrayValues": 64,
//         "maxStructFields": -1
//     },
//     "apiVersion": 2,
//     "showGlobalVariables": true
// }

// Open a new Debug Visualizer and visualize "s"
func main() {
	rand.Seed(time.Now().UnixNano())
	graph := NewGraph()
	var s string
	for i := 0; i < 100; i++ {
		id := strconv.Itoa(i)
		graph.Nodes = append(graph.Nodes, NodeGraphData{
			ID:    id,
			Label: id,
		})
		if i > 0 {
			targetId := rand.Intn(i)
			graph.Edges = append(graph.Edges, EdgeGraphData{
				From: id,
				To:   strconv.Itoa(targetId),
			})
		}
		s = graph.toString()
		_ = s
		//fmt.Printf("%s", s)
	}
}

type Graph struct {
	Kind  map[string]bool `json:"kind"`
	Nodes []NodeGraphData `json:"nodes"`
	Edges []EdgeGraphData `json:"edges"`
}

type NodeGraphData struct {
	ID    string `json:"id"`
	Label string `json:"label,omitempty"`
	Color string `json:"color,omitempty"`
	Shape string `json:"shape,omitempty"`
}

type EdgeGraphData struct {
	From   string `json:"from"`
	To     string `json:"to"`
	Label  string `json:"label,omitempty"`
	ID     string `json:"id"`
	Color  string `json:"color,omitempty"`
	Dashes bool   `json:"dashes,omitempty"`
}

func NewGraph() *Graph {
	return &Graph{
		Kind:  map[string]bool{"graph": true},
		Nodes: []NodeGraphData{},
		Edges: []EdgeGraphData{},
	}
}

func (this *Graph) toString() string {
	rs, _ := json.Marshal(this)
	return string(rs)
}