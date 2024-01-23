import json
from typing import Union, Dict, Optional
from abc import ABC

from pyDataExtraction.commonTypes.Graph import Graph

if __name__ == "__main__":
    # NOTE this will likely be what will be called by the PyEvaluation Engine,
    # this will be where this library interfaces with the existing codebase

    # TODO: implement testing for each dataType, it may be a good idea to compare
    # with output of typescript extractors
    graph_data1 = {"A": ["B", "C"], "B": ["A", "C"], "C": ["A", "D"], "D": ["A"]}
    graph_data2 = {1: [2, 3], 2: [1, 3], 3: [1, 4], 4: [1]}
    graph = Graph(graph_data1)
    print(graph)