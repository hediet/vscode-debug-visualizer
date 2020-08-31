from json import dumps
from abc import ABC, abstractmethod

# import logging
# TODO fix the import structure
# TODO figure out how to set up logging across a python library


class DataType(ABC):
    """Abstract class for all supported dataTypesdataTypes

    Args:
        object ([type]): [description]
    """

    def __init__(self):
        self.kind = {}
        super().__init__()

    def __repr__(self):
        """returns json object format when printed or using str()
        """
        return dumps(self.__dict__)

