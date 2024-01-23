from typing import Union, Dict, Optional
from pyDataExtraction.commonTypes.base import DataType

# from docs
"""
interface NodeGraphData {
	id: string;
	label?: string;
	color?: string;
	shape?: "ellipse" | "box";
}
"""
"""
interface EdgeGraphData {
	from: string;
	to: string;
	label?: string;
	id?: string;
	color?: string;
	dashes?: boolean;
}
"""
# NOTE: may not be able to encapsulate edge in separate class due to from being a syntax token
"""
class Edge:
    
    def __init__(self,from: str, to: str,):
        self.fromnode
        
    def __repr__(self):
        pass
"""
# NOTE: ran into issue Node object is not json serializable when ecapsulating in own class
"""
class Node(DataType):
    def __init__(self, id: Union[int, str], label: Optional[str] = None):
        super().__init__()
        self.id = id
        if label is None:
            self.label = id
        else:
            self.label = label
"""


class Graph(DataType):
    """An implementation of the Graph data type for the visualizer

    Args:
        DataType (Union[Dict[str, list], Dict[int, list]]): 
        either expects a dictionary with a list as values or a 2d array
        some representation of a basic graph 
    """

    def __init__(self, graph_data: Union[Dict[str, list], Dict[int, list]]):
        super().__init__()
        self.kind["graph"] = True
        # TODO get working for both a dictionary and an nxn array
        self.nodes = []
        self.edges = []
        if isinstance(graph_data, dict):
            for node in graph_data:
                self.nodes.append({"id": str(node)})
                # TODO change prints to log statements
                # print("node: ", node)
                # print("edges: ", graph_data[node])
                for edge in graph_data[node]:
                    # print("edge: ", graph_data[node][edge_i])
                    self.edges.append({"from": node, "to": edge})
