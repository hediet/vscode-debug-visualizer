import 'dart:convert';

String graph(List<GraphNode> nodes, List<GraphEdge> edges) {
  return jsonEncode({
    'kind': {'graph': true},
    'nodes': nodes,
    'edges': edges,
  });
}

String plotly(List<num> values) {
  return jsonEncode({
    'kind': {'plotly': true},
    'data': [
      {'y': values}
    ],
  });
}

String tree(TreeNode root) {
  return jsonEncode({
    'kind': {'tree': true},
    'root': root,
  });
}

class Graph {
  List<GraphNode> nodes;
  List<GraphEdge> edges;
}

class GraphEdge {
  final String from;
  final String to;
  final String label;

  GraphEdge(this.from, this.to, this.label);

  Map<String, dynamic> toJson() => {
        'from': from,
        'to': to,
        'label': label,
      };
}

class GraphNode {
  final String id;
  final String label;

  GraphNode(
    this.id,
    this.label,
  );

  Map<String, dynamic> toJson() => {
        'id': id,
        'label': label,
      };
}

class TreeNode {
  final List<TreeNode> children;
  final List<TreeNodeItem> items;
  final String segment;
  final bool isMarked;

  TreeNode(this.children, this.items, this.segment, [this.isMarked = false]);

  Map<String, dynamic> toJson() => {
        'children': children ?? [],
        'items': items,
        'segment': segment,
        'isMarked': isMarked,
      };
}

class TreeNodeItem {
  final String text;

  TreeNodeItem(this.text);

  Map<String, dynamic> toJson() => {
        'text': text,
      };
}
