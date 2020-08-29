use serde::Serialize;

// expected to mirror
// https://hediet.github.io/visualization/docs/visualization-data-schema.json
//
// implements the grid visualizer as an example

pub type Label = String;

/// `GridVisualizationData` in schema
#[derive(Debug, Serialize)]
pub struct Grid {
    kind: Kind,
    rows: Vec<Row>,

    #[serde(rename = "columnLabels")]
    #[serde(skip_serializing_if="Option::is_none")]
    column_labels: Option<Vec<Label>>,
}

#[derive(Debug, Serialize)]
pub struct Kind {
    grid: bool,
}

#[derive(Debug, Serialize)]
pub struct Row {
    columns: Vec<Column>,

    #[serde(skip_serializing_if="Option::is_none")]
    label: Option<Label>,
}

#[derive(Debug, Serialize)]
pub struct Column {
    /// value to display to the user
    #[serde(skip_serializing_if="Option::is_none")]
    content: Option<String>,

    /// unique value to identify this cell, if desired
    #[serde(skip_serializing_if="Option::is_none")]
    tag: Option<String>,

    // TODO: valid values / syntax?
    #[serde(skip_serializing_if="Option::is_none")]
    color: Option<String>,
}

fn show_arr(a: &[i32]) -> String {
    let columns: Vec<Column> = a
        .iter()
        .map(|x| Column {
            content: Some(format!("{:?}", x)),
            tag: None,

            // TODO: `color` value doesn't seem to change visualizer's output at all
            color: "who-knows".to_owned().into(),
        })
        .collect();

    let row = Row {
        columns,
        // TODO: visualizer doesn't seem to render this
        label: "my row".to_owned().into(),
    };

    let kind = Kind { grid: true };

    let grid = Grid {
        kind,
        rows: vec![row],

        // TODO: visualizer doesn't seem to work if this is non-`None`
        column_labels: None,
    };

    serde_json::to_string(&grid).unwrap()
}

fn main() {
    let mut arr = vec![1, 2, 3];
    let mut _s = show_arr(&arr);
    for _ in 0..5 {
        arr.swap(0, 2); // set a break-point here, to easily observe the change
        _s = show_arr(&arr);
    }
    dbg!(arr);
    println!("break-point here, too");
}