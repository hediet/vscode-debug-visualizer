import numpy as np


# put "x" in the Debug Visualizer and use step by step
# debugging to see the diffrent types of data visualization


x = 5
x = "asdf"
x = 5.5
x = [1, 2, 3, 4, 5, 6, "a", "b"]
x = ["b", "a", "c", "d", "e"]
x.sort()
x = {
    "asdf1": "dasdf",
    "asdf2": "dasdf",
    "asdf3": {"foo": "bar"},
}

x = [1, 2, 3, 4, 5, 6]
# histogram
x = np.concatenate([np.arange(i) for i in range(9)])
x = x.reshape(2, -1)


# one dimension
x = np.arange(100)
x = np.linspace(-np.pi, np.pi, 100)
x = np.sin(x)

# 2 dimension
x = x.reshape(5, 20)
# 2 dimension transpose
x = x.transpose()
x = x.transpose()

# 3 dimensions
x = x.reshape(2, 5, 10)

# 4 dimensions
x = x.reshape(2, 5, 2, 5)

# big number
x = np.empty(2 ** 24)
x[0:1000000] = 1
x[1000000:10000000] = 5

# pyTorch
try:
    import torch

    x = np.concatenate([np.arange(i) for i in range(9)])
    x = x.reshape(2, -1)
    x = torch.Tensor(x)
    pass

except ImportError:
    pass


# tensorflow

try:
    import tensorflow as tf

    x = np.concatenate([np.arange(i) for i in range(9)])
    x = x.reshape(2, -1)
    x = tf.convert_to_tensor(x)
    pass
except ImportError:
    pass


# pandas

try:
    import pandas as pd
    import plotly.express as px

    x = px.data.gapminder().query("year == 2007")
    pass
except ImportError:
    pass

# custom visualizer defined in ./debugvisualizer.py (this file is included automatically)

from Person import Person

x = Person("Aria")
parent1 = Person("Eduart")
parent2 = Person("Catelyn")
x.addParent(parent1)
x.addParent(parent2)
parent1.addParent(Person("Benjen"))

# direct debug-visualizer json as dict with property "kind"

x = {
    "kind": {"dotGraph": True},
    "text": '\ndigraph G {\n    subgraph cluster_0 {\n      style=filled;\n      color=lightgrey;\n      node [style=filled,color=white];\n      a0 -> a1 -> a2 -> a3;\n      label = "process #1";\n    }\n  \n    subgraph cluster_1 {\n      node [style=filled];\n      b0 -> b1 -> b2 -> b3;\n      label = "process #2";\n      color=blue\n    }\n    start -> a0;\n    start -> b0;\n    a1 -> b3;\n    b2 -> a3;\n    a3 -> a0;\n    a3 -> end;\n    b3 -> end;\n  \n    start [shape=Mdiamond];\n    end [shape=Msquare];\n}\n',
}

x = {
    "kind": {"plotly": True},
    "data": [
        {
            "mode": "lines",
            "type": "scatter",
            "x": ["A", "B", "C"],
            "xaxis": "x",
            "y": [4488916, 3918072, 3892124],
            "yaxis": "y",
        },
        {
            "cells": {"values": [["A", "B", "C"], [341319, 281489, 294786], [4488916, 3918072, 3892124]]},
            "domain": {"x": [0.0, 1.0], "y": [0.0, 0.60]},
            "header": {"align": "left", "font": {"size": 10}, "values": ["Date", "Number", "Output"]},
            "type": "table",
        },
    ],
    "layout": {"xaxis": {"anchor": "y", "domain": [0.0, 1.0]}, "yaxis": {"anchor": "x", "domain": [0.75, 1.0]}},
}
pass