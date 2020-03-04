package main

import (
	"encoding/json"
	"fmt"
	"math/rand"
	"strconv"
	"time"
)

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

func main() {
	rand.Seed(time.Now().UnixNano())
	graph := NewGraph()
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
		s := graph.toString()
		fmt.Printf("%s", s)
	}
}
