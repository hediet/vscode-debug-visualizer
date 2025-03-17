#include <iostream>
#include <algorithm>
#include <vector>
#include <string>
#include <jsoncons/json.hpp>
#include <cassert>

using namespace jsoncons; // for convenience
using namespace std;

// visualize `myGraphJson`!
string myGraphJson = "{\"kind\":{\"graph\":true},"
                     "\"nodes\":[{\"id\":\"1\"},{\"id\":\"2\"}],"
                     "\"edges\":[{\"from\":\"1\",\"to\":\"2\"}]}";

class Graph
{
private:
  char *tempPtr = NULL;
  char *constPtr = NULL;
  ojson j;

public:
  Graph()
  {
    tempPtr = new char[myGraphJson.length() + 1];
    strcpy(tempPtr, myGraphJson.c_str());
    constPtr = tempPtr;
    j = ojson::parse(constPtr);
  }

  ~Graph()
  {
    delete[] constPtr;
    constPtr = NULL;
    tempPtr = NULL;
  }
  void addNode(string NodeValue)
  {
    multimap<string, string> Node;
    Node.emplace("id", NodeValue);
    Node.emplace("label", NodeValue);
    Node.emplace("color", "orange");
    j["nodes"].push_back(Node);
  }

  void addEdge(string from, string to)
  {
    multimap<string, string> Edge;
    Edge.emplace("from", from);
    Edge.emplace("to", to);
    Edge.emplace("color", "blue");
    j["edges"].push_back(Edge);
  }

  void visualize()
  {
    myGraphJson = "";
    j.dump(myGraphJson);
  }
};

int main()
{
  Graph *g1 = new Graph(); // apply breakpoint here
  // put command once "-exec set print elements 0" in debug console
  g1->visualize();
  g1->addNode("3");
  g1->visualize();
  g1->addNode("4");
  g1->visualize();
  g1->addEdge("1", "3");
  g1->visualize();
  g1->addEdge("1", "4");
  g1->visualize();

  return 0;
}
