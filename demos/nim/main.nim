import random, json, options, sugar

type
  Kind = object
    array: bool
  
  Label = object
    label: Option[string]
  
  Column = object
    content: Option[string]
    tag: Option[string]
    color: Option[string]
  
  Row = object
    label: Option[string]
    columns: seq[Column]
  
  Marker = object
    id: string
    row: int
    column: int
    rows: Option[int]
    columns: Option[int]
    label: Option[string]
    color: Option[string]
  
  Grid = object
    kind: Kind
    columnLabels: Option[seq[Label]]
    rows: seq[Row]
    markers: Option[seq[Marker]]

proc showSeq[T](data: seq[T], markers: seq[(string, int)] = @[]): cstring = 
  # Need to use cstring string type for C-compatible strings
  let labels = collect(newSeq):
    # Labels are indexes of the seq
    for x in 0 ..< data.len():
      Label(label: some($x))
  
  let columns = collect(newSeq):
    # Columns contain values of the seq
    for x in data:
      Column(content: some($x), tag: some($x))
  
  let marks = collect(newSeq):
    # If there are any markers (id - string, index - int)
    for marker in markers:
      Marker(id: marker[0], row: 0, column: marker[1])

  let grid = Grid(
    kind: Kind(array: true),
    rows: @[Row(columns: columns)],
    columnLabels: some(labels),
    markers: some(marks)
  )
  # Serialize to JSON
  result = $ %grid

proc main = 
  # Random seed
  randomize()

  # Fill seq with 10 random values from 1 to 999
  var a = newSeq[int]()
  for x in 0..10:
    a.add rand(1..999)
  
  # Simple bubble sort with some markers
  # Open the visualizer and type in "ress"
  let n = a.len() - 1
  var ress = showSeq(a, @[("i", 0), ("j", 0)])
  for i in 0 .. n:
    for j in 0 .. n - i - 1:
      if a[j] > a[j+1]:
        ress = showSeq(a, @[("i", i), ("j", j)]) # breakpoint
        let temp = a[j]
        a[j] = a[j + 1]
        a[j + 1] = temp
        ress = showSeq(a, @[("i", i), ("j", j)]) # breakpoint

main()