use serde::Serialize;

#[derive(Debug, Serialize)]
struct Label {
    label: Option<String>,
}
#[derive(Debug, Serialize)]
struct Row {
    label: Option<String>,
    columns: Vec<Column>,
}
#[derive(Debug, Serialize)]
struct Column {
    content: Option<String>,
    tag: Option<String>,
    color: Option<String>,
}
#[derive(Debug, Serialize)]
struct Marker {
    id: String,
    row: u64,
    column: u64,
    rows: Option<u64>,
    columns: Option<u64>,
    label: Option<String>,
    color: Option<String>,
}

#[allow(clippy::trivially_copy_pass_by_ref)]
fn is_false(b: &bool) -> bool {
    !*b
}

#[derive(Debug, Serialize)]
struct Kind {
    #[serde(skip_serializing_if = "is_false")]
    array: bool,
}

#[derive(Debug, Serialize)]
pub struct Grid {
    kind: Kind,
    #[serde(rename = "columnLabels")]
    column_labels: Option<Vec<Label>>,
    rows: Vec<Row>,
    markers: Option<Vec<Marker>>,
}

fn show_arr(a: &[i32]) -> String {
    let n = a.len();
    let labels: Vec<Label> = (0..n)
        .map(|i| Label {
            label: Some(i.to_string()),
        })
        .collect();
    let columns: Vec<Column> = a
        .iter()
        .map(|x| Column {
            content: Some(format!("{:?}", x)),
            tag: Some(x.to_string()),
            color: None,
        })
        .collect();
    let row = Row {
        label: None,
        columns,
    };
    let kind = Kind { array: true };

    let grid = Grid {
        kind,
        column_labels: Some(labels),
        rows: vec![row],
        markers: None,
    };

    serde_json::to_string(&grid).unwrap()
}

fn main() {
    let mut arr = vec![1, 2, 3];
    let mut _s = show_arr(&arr);
    for _ in 0..5 {
        arr.swap(0, 2); // break point
        _s = show_arr(&arr);
    }
    dbg!(arr); // break point
    println!("Hello, world!");
}