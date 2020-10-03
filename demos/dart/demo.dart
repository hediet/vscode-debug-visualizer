import 'dart:collection';
import 'dart:developer';
import 'dart:math';

// ignore: unused_import
import 'debug_visualizers.dart';

final _rnd = Random();

String Function() visualize;

void main() {
  debugger();
  // Open a Debug Visualizer window and evalute the expression "visualize()"
  // and then press Continue to step through the samples.
  plotly_demo();
  graph_demo();
  tree_demo();
}

void plotly_demo() {
  final values = <int>[];
  visualize = () => plotly(values);
  for (var i = 0; i < 20; i++) {
    debugger();
    values.add(i + _rnd.nextInt(5) - 2);
  }
}

void graph_demo() {
  graphFromDoubleLinked<T>(
      DoubleLinkedQueue<T> values, String Function(T) toString) {
    node(T s) => GraphNode(toString(s), toString(s));
    edge(DoubleLinkedQueueEntry<T> e) => [
          if (e.nextEntry() != null)
            GraphEdge(
              toString(e.element),
              toString(e.nextEntry().element),
              "next",
            ),
          if (e.previousEntry() != null)
            GraphEdge(
              toString(e.element),
              toString(e.previousEntry().element),
              "prev",
            ),
        ];

    final nodes = values.map(node).toList();
    final edges = <GraphEdge>[];
    values.forEachEntry((e) => edges.addAll(edge(e)));
    return graph(nodes, edges);
  }

  final values = DoubleLinkedQueue<String>();
  visualize = () => graphFromDoubleLinked(values, (s) => s);

  for (var i = 0; i < 10; i++) {
    debugger();
    values.addLast('Node $i');
  }
}

void tree_demo() {
  var nodeNum = 1;
  TreeNode createNode(int levels) {
    final name = 'Node ${nodeNum++}';
    final children =
        levels > 0 ? List.generate(2, (_) => createNode(levels - 1)) : null;
    return TreeNode(children, [TreeNodeItem(name)], name);
  }

  var levels = 0;
  visualize = () {
    nodeNum = 1;
    return tree(createNode(levels));
  };

  for (var i = 1; i < 5; i++) {
    debugger();
    levels = i;
  }
}
