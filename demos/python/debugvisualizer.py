from Person import Person
import json
from vscodedebugvisualizer import globalVisualizationFactory


class PersonVisualizer:
    def checkType(self, t):
        return isinstance(t, Person)

    def visualizePerson(self, person: Person, nodes=[], edges=[]):
        if person.name in [n["id"] for n in nodes]:
            return nodes, edges

        nodes.append(
            {
                "id": person.name,
                "label": person.name,
            }
        )

        for p in person.parents:
            nodes, edges = self.visualizePerson(p, nodes, edges)
            edges.append(
                {
                    "from": p.name,
                    "to": person.name,
                }
            )

        return nodes, edges

    def visualize(self, person: Person):
        jsonDict = {
            "kind": {"graph": True},
            "nodes": [],
            "edges": [],
        }

        self.visualizePerson(person, jsonDict["nodes"], jsonDict["edges"])

        return json.dumps(jsonDict)


globalVisualizationFactory.addVisualizer(PersonVisualizer())
