package app;

import java.util.HashMap;
import java.util.LinkedList;

class Node {
	int data;
	Node next = null;
	Node prev = null;

	public Node(int a) {
		data = a;
	}
}

class TreeNode {
	int data;
	TreeNode left, right;

	public TreeNode(int item) {
		data = item;
		left = right = null;
	}
}

public class Visualizer {
	/**
	 * For a singly linked list, doubly linked list and circular linked list, pass
	 * the node to the method node.
	 * 
	 * @param node  A node pointiong to the head of the list
	 * @param nodes Additional Nodes pointion to an element in the list in case you
	 *              want to monitor other variables.
	 * @return It returns a string in JSON Format
	 */
	public static String node(Node node, Node... nodes) {
		return node(new String("head"), node, nodes);
	}

	/**
	 * 
	 * For a singly linked list, doubly linked list and circular linked list, pass
	 * the node to the method node.
	 * 
	 * @param S     A string which contains the name for the head pointer in a
	 *              string.
	 * @param node  A node pointiong to the head of the list.
	 * @param nodes Additional Nodes pointion to an element in the list in case you
	 *              want to monitor other variables.
	 * @return It returns a string in JSON Format
	 */
	public static String node(String S, Node node, Node... nodes) {
		String jsonString = new String("{ \"kind\": { \"graph\": true }, \"nodes\": ");

		LinkedList<HashMap<String, String>> nodeList = new LinkedList<HashMap<String, String>>();
		LinkedList<HashMap<String, String>> edgeList = new LinkedList<HashMap<String, String>>();
		HashMap<String, String> nodeMap;
		HashMap<String, String> edgeMap;

		nodeMap = new HashMap<String, String>();
		nodeMap.put("\"id\"", "\"" + S + "\"");
		nodeMap.put("\"label\"", "\"" + S + "\"");
		nodeMap.put("\"color\"", "\"orange\"");
		nodeList.add(nodeMap);

		if (node != null) {
			edgeMap = new HashMap<String, String>();
			edgeMap.put("\"from\"", "\"" + S + "\"");
			edgeMap.put("\"to\"", "\"" + node + "\"");
			edgeList.add(edgeMap);
		}
		try {
			Node temp = node;
			do {
				nodeMap = new HashMap<String, String>();
				nodeMap.put("\"id\"", "\"" + temp + "\"");
				nodeMap.put("\"label\"", "\"" + temp.data + "\"");
				nodeMap.put("\"color\"", "\"dodgerblue\"");
				nodeList.add(nodeMap);

				edgeMap = new HashMap<String, String>();
				edgeMap.put("\"from\"", "\"" + temp + "\"");
				edgeMap.put("\"to\"", "\"" + temp.next + "\"");
				edgeMap.put("\"label\"", "\"next\"");
				edgeList.add(edgeMap);

				// Remove for singly linked list
				{
					edgeMap = new HashMap<String, String>();
					edgeMap.put("\"from\"", "\"" + temp + "\"");
					edgeMap.put("\"to\"", "\"" + temp.prev + "\"");
					edgeMap.put("\"label\"", "\"prev\"");
					edgeMap.put("\"color\"", "\"lightgreen\"");
					edgeList.add(edgeMap);
				}

				temp = temp.next;
			} while (temp != null && temp != node);

		} catch (Exception e) {
		}

		for (int i = 0; i < nodes.length; i++) {
			try {
				nodeMap = new HashMap<String, String>();
				nodeMap.put("\"id\"", "\"label-" + i + "\"");
				nodeMap.put("\"label\"", "\"Argument - " + i + "\"");
				nodeMap.put("\"color\"", "\"orange\"");
				nodeList.add(nodeMap);

				edgeMap = new HashMap<String, String>();
				edgeMap.put("\"from\"", "\"label-" + i + "\"");
				edgeMap.put("\"to\"", "\"" + nodes[i] + "\"");
				edgeList.add(edgeMap);
			} catch (Exception e) {
			}
		}
		jsonString += nodeList.toString() + ", \"edges\": ";
		jsonString += edgeList + " }";
		jsonString = jsonString.replaceAll("[=]", ":");
		return jsonString;

	}

	private static void inorder(TreeNode node, LinkedList<HashMap<String, String>> nodeList,
			LinkedList<HashMap<String, String>> edgeList) {
		if (node != null) {
			HashMap<String, String> nodeMap;
			HashMap<String, String> edgeMap;
			nodeMap = new HashMap<String, String>();
			nodeMap.put("\"id\"", "\"" + node + "\"");
			nodeMap.put("\"label\"", "\"" + node.data + "\"");
			nodeMap.put("\"color\"", "\"dodgerblue\"");
			nodeList.add(nodeMap);

			edgeMap = new HashMap<String, String>();
			edgeMap.put("\"from\"", "\"" + node + "\"");
			edgeMap.put("\"to\"", "\"" + node.left + "\"");
			edgeMap.put("\"label\"", "\"left\"");
			edgeList.add(edgeMap);

			edgeMap = new HashMap<String, String>();
			edgeMap.put("\"from\"", "\"" + node + "\"");
			edgeMap.put("\"to\"", "\"" + node.right + "\"");
			edgeMap.put("\"label\"", "\"right\"");
			edgeList.add(edgeMap);
			inorder(node.left, nodeList, edgeList);
			inorder(node.right, nodeList, edgeList);
		}
	}

	/**
	 * For a binaary tree, pass the roots as the node.
	 * 
	 * @param node  The node pointing to the root of the tree.
	 * @param nodes Additional nodes in case you want to monitor other variables.
	 * @return It returns a string in JSON Format.
	 */
	public static String treeNode(TreeNode node, TreeNode... nodes) {
		return treeNode(new String("root"), node, nodes);
	}

	/**
	 * For a binaary tree, pass the roots as the node.
	 * 
	 * @param S     A string which contains the name of the node pointion to the
	 *              root of the tree.
	 * @param node  The node pointing to the root of the tree.
	 * @param nodes Additional nodes in case you want to monitor other variables.
	 * @return It returns a string in JSON Format.
	 */
	public static String treeNode(String S, TreeNode node, TreeNode... nodes) {
		String jsonString = new String("{ \"kind\": { \"graph\": true }, \"nodes\": ");

		LinkedList<HashMap<String, String>> nodeList = new LinkedList<HashMap<String, String>>();
		LinkedList<HashMap<String, String>> edgeList = new LinkedList<HashMap<String, String>>();
		HashMap<String, String> nodeMap;
		HashMap<String, String> edgeMap;

		nodeMap = new HashMap<String, String>();
		nodeMap.put("\"id\"", "\"" + S + "\"");
		nodeMap.put("\"label\"", "\"" + S + "\"");
		nodeMap.put("\"color\"", "\"orange\"");
		nodeList.add(nodeMap);

		if (node != null) {
			edgeMap = new HashMap<String, String>();
			edgeMap.put("\"from\"", "\"" + S + "\"");
			edgeMap.put("\"to\"", "\"" + node + "\"");
			edgeList.add(edgeMap);
		}

		for (int i = 0; i < nodes.length; i++) {
			try {
				nodeMap = new HashMap<String, String>();
				nodeMap.put("\"id\"", "\"label-" + i + "\"");
				nodeMap.put("\"label\"", "\"Argument - " + i + "\"");
				nodeMap.put("\"color\"", "\"orange\"");
				nodeList.add(nodeMap);

				edgeMap = new HashMap<String, String>();
				edgeMap.put("\"from\"", "\"label-" + i + "\"");
				edgeMap.put("\"to\"", "\"" + nodes[i] + "\"");
				edgeList.add(edgeMap);
			} catch (Exception e) {
			}
		}

		inorder(node, nodeList, edgeList);

		jsonString += nodeList.toString() + ", \"edges\": ";
		jsonString += edgeList + " }";
		jsonString = jsonString.replaceAll("[=]", ":");
		return jsonString;

	}
}
