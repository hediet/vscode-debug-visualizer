package main

import (
	"encoding/json"
	"math/rand"
	"strconv"
	"time"
)

// Debug using Delve needs to adjust the configuration
// Delve's maxStringLen default is small and needs to be adjusted for the maxStringLen default of the delve. See in detail (microsoft/vscode-go#868).
// Add the following configuration to
//launch.json
// "dlvLoadConfig": {
//                 "followPointers": true,
//                 "maxVariableRecurse": 1,
//                 "maxStringLen": 5000,
//                 "maxArrayValues": 64,
//                 "maxStructFields": -1
//             }

// debuging test Must be set settings.json
//settings.json
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

// Visualize "s"
func main() {
	rand.Seed(time.Now().UnixNano())
	graph := NewGraph()
	var s string
	for i := 2; i < 100; i++ {
		id := strconv.Itoa(i)
		graph.Nodes = append(graph.Nodes, NodeGraphData{
			ID:    id,
			Label: id,
		})
		targetId := rand.Intn(i) + 1
		graph.Edges = append(graph.Edges, EdgeGraphData{
			From: id,
			To:   strconv.Itoa(targetId),
		})
		s = graph.toString()
		_ = s
		//fmt.Printf("%s", s)
	}
}
