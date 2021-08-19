class Person:
    def __init__(self, name, parents=None) -> None:
        self.name = name
        self.parents = [] if parents is None else parents

    def addParent(self, parent: "Person"):
        self.parents.append(parent)
