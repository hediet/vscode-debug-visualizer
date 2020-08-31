from json import dumps
from typing import Union, Dict, Optional
from abc import ABC, abstractmethod
from pyDataExtraction.commonTypes.Graph import Graph

if __name__ == "__main__":
    graph_data1 = {"A": ["B", "C"], "B": ["A,C"], "C": ["A,D"], "D": ["A"]}
    graph_data2 = {1: [2, 3], 2: [1, 3], 3: [1, 4], 4: [1]}
    graph = Graph(graph_data1)
    print(graph)
