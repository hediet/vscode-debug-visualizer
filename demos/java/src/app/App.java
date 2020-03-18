package app;

import app.GraphData.EdgeInfo;

public class App {

    public static void main(String[] args) {
        // watch `list.visualize()`
        LinkedList<String> list = new LinkedList<String>();
        list.append("1");
        list.append("2");
        list.append("3");
        list.append("4");
    }
}

class LinkedList<T> {
    private Node<T> head;

    public void append(T value) {
        if (head == null) {
            head = new Node<T>(value);
        } else {
            Node<T> m = head;
            while (m.next != null) {
                m = m.next;
            }
            m.next = new Node<T>(value);
        }
    }

    public String visualize() {
        Node<T> list = new Node<T>(null);
        list.next = this.head;

        return GraphData.from(list, (item, info) -> {
            if (item != list) {
                info.id = item.value.toString();
            } else {
                info.label = "list";
            }
            if (item.next != null) {
                EdgeInfo<LinkedList.Node<T>> ei = info.addEdge(item.next);
                ei.label = "next";
            }
            return info;
        }).toString();
    }

    static class Node<T> {
        public T value;
        public Node<T> next;

        public Node(T value) {
            this.value = value;
        }
    }
}
