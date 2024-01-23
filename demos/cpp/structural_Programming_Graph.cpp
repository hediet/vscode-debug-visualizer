#include <iostream>
#include <algorithm>
#include <vector>
#include <string>
#include <jsoncons/json.hpp>
#include <cassert>

using namespace jsoncons; // for convenience
using namespace std;

void addNode(ojson &j, string NodeValue)
{
    multimap<string, string> Node;
    Node.emplace("id", NodeValue);
    Node.emplace("label", NodeValue);
    Node.emplace("color", "orange");
    j["nodes"].push_back(Node);
}
void addEdge(ojson &j, string from, string to)
{
    multimap<string, string> Edge;
    Edge.emplace("from", from);
    Edge.emplace("to", to);
    Edge.emplace("color", "blue");
    j["edges"].push_back(Edge);
}

int main()
{
    // visualize `myGraphJson`!
    string myGraphJson = "{\"kind\":{\"graph\":true},"
                         "\"nodes\":[{\"id\":\"1\"},{\"id\":\"2\"}],"
                         "\"edges\":[{\"from\":\"1\",\"to\":\"2\"}]}";

    char *tempPtr = new char[myGraphJson.length() + 1];
    strcpy(tempPtr, myGraphJson.c_str());
    char *constPtr = tempPtr;
    ojson j = ojson::parse(constPtr);

    string temps1, temps2, temps3; // apply breakpoint here
    // put command once "-exec set print elements 0" in debug console
    addNode(j, "3");
    j.dump(temps1); // visualize temps1
    cout << myGraphJson;
    addNode(j, "4");
    addEdge(j, "1", "3");
    j.dump(temps2); // visualize temps2
    cout << myGraphJson;
    addEdge(j, "1", "4");
    j.dump(temps3); // visualize temps3
    cout << myGraphJson;
}