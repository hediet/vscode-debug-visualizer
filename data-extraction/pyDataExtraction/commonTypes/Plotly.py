from pyDataExtraction.commonTypes.base import DataType

"""
export interface Plotly {
	kind: { plotly: true };
	data: Partial<Plotly.Data>[];
}
// See plotly docs for Plotly.Data.
"""


class Plotly(DataType):
    def __init__(self, data):
        super().__init__()
        self.kind["plotly"] = True
