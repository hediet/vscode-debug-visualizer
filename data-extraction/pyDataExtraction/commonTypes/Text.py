from typing import Optional
from pyDataExtraction.commonTypes.base import DataType

"""
interface Text {
	kind: { text: true };
	text: string;
	mimeType?: string;
	fileName?: string;
}
"""


class Text(DataType):
    def __init__(
        self,
        text_data: str,
        mimeType: Optional[str] = None,
        fileName: Optional[str] = None,
    ):
        super().__init__()

        self.kind["text"] = True
        self.text = text_data
        if mimeType is None:
            self.mimeType = mimeType
        if fileName is None:
            self.fileName = fileName


"""
interface Svg extends Text {
	kind: { text: true; svg: true };
}
"""


class Svg(Text):
    def __init__(
        self,
        text_data: str,
        mimeType: Optional[str] = None,
        fileName: Optional[str] = None,
    ):
        self.kind["svg"] = True
        super().__init__(text_data, mimeType, fileName)


"""
interface DotGraph extends Text {
	kind: { text: true; dotGraph: true };
}
"""


class DotGraph(Text):
    def __init__(
        self,
        text_data: str,
        mimeType: Optional[str] = None,
        fileName: Optional[str] = None,
    ):
        self.kind["dotGraph"] = True
        super().__init__(text_data, mimeType, fileName)
