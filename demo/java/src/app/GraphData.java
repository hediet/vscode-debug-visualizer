package app;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonInclude.Include;

public class GraphData extends ExtractedData {
    private List<NodeData> nodes = new ArrayList<>();
    private List<EdgeData> edges = new ArrayList<>();

    @Override
    protected String[] getTags() {
        return new String[] { "graph" };
    }

    public List<NodeData> getNodes() {
        return this.nodes;
    }

    public List<EdgeData> getEdges() {
        return this.edges;
    }

    @JsonInclude(Include.NON_NULL)
    public static class NodeData {
        private String id;
        private String label; // can be null
        private String color; // can be null
        private String shape; // can be null

        public NodeData(String id) {
            this.id = id;
        }

        public String getId() {
            return this.id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getLabel() {
            return this.label;
        }

        public void setLabel(String label) {
            this.label = label;
        }

        public String getColor() {
            return this.color;
        }

        public void setColor(String color) {
            this.color = color;
        }

        public String getShape() {
            return this.shape;
        }

        public void setShape(String shape) {
            this.shape = shape;
        }
    }

    @JsonInclude(Include.NON_NULL)
    public static class EdgeData {
        private String from;
        private String to;
        private String label; // Can be null
        private String id; // Can be null
        private String color; // Can be null
        private Boolean dashes; // Can be null

        public EdgeData(String from, String to) {
            this.from = from;
            this.to = to;
        }

        public String getFrom() {
            return this.from;
        }

        public void setFrom(String from) {
            this.from = from;
        }

        public String getTo() {
            return this.to;
        }

        public void setTo(String to) {
            this.to = to;
        }

        public String getLabel() {
            return this.label;
        }

        public void setLabel(String label) {
            this.label = label;
        }

        public String getId() {
            return this.id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getColor() {
            return this.color;
        }

        public void setColor(String color) {
            this.color = color;
        }

        public Boolean getDashes() {
            return this.dashes;
        }

        public void setDashes(Boolean dashes) {
            this.dashes = dashes;
        }
    }

    public interface NodeInfoProvider<T> {
        public NodeInfo<T> getNodeInfo(T item, NodeInfo<T> nodeInfo);
    }

    public static <T> GraphData from(T item, NodeInfoProvider<T> f) {
        GraphData d = new GraphData();
        ArrayDeque<T> q = new ArrayDeque<>();
        q.add(item);

        FromState<T> s = new FromState<>(f);

        while (q.size() > 0) {
            NodeInfo<T> nodeInfo = s.getNodeInfo(q.removeFirst());
            NodeData nd = new NodeData(s.getId(nodeInfo));
            d.nodes.add(nd);

            nd.setLabel(nodeInfo.label);
            nd.setColor(nodeInfo.color);

            for (EdgeInfo<T> e : nodeInfo.edges) {
                EdgeData ed = new EdgeData(nd.id, s.getId(s.getNodeInfo(e.to)));
                d.edges.add(ed);
                ed.setLabel(e.label);
                ed.setId(e.id);

                q.add(e.to);
            }

        }

        return d;
    }

    static class FromState<T> {
        private int i = 0;
        private NodeInfoProvider<T> provider;
        private HashMap<T, NodeInfo<T>> infos = new HashMap<>();

        public FromState(NodeInfoProvider<T> provider) {
            this.provider = provider;
        }

        public String getId(NodeInfo<T> nodeInfo) {
            if (nodeInfo.id == null) {
                nodeInfo.id = "hediet.de/" + (i++);
            }
            return nodeInfo.id;
        }

        public NodeInfo<T> getNodeInfo(T item) {
            if (infos.containsKey(item)) {
                return infos.get(item);
            }

            NodeInfo<T> info = this.provider.getNodeInfo(item, new NodeInfo<>());
            infos.put(item, info);
            return info;
        }
    }

    public static class NodeInfo<T> {
        public ArrayList<EdgeInfo<T>> edges = new ArrayList<EdgeInfo<T>>();
        public String label; // Can be null.
        public String id; // Can be null.
        public String color; // Can be null.

        public EdgeInfo<T> addEdge(T to) {
            EdgeInfo<T> i = new EdgeInfo<>(to);
            this.edges.add(i);
            return i;
        }
    }

    public static class EdgeInfo<T> {
        public T to;
        public String label; // Can be null.
        public String id; // Can be null.

        public EdgeInfo(T to) {
            this.to = to;
        }
    }
}