import { observer } from "mobx-react";
import * as classNames from "classnames";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { ReactSVGPanZoom, Tool } from 'react-svg-pan-zoom';
import { computed, observable, autorun, runInAction } from "mobx";
import Measure, { ContentRect } from 'react-measure';
import Viz from 'viz.js';
import { Module, render } from 'viz.js/full.render.js';

export interface GraphData {
    kind: "GraphData";
    nodes: { id: string; label: string; }[];
    edges: { from: string; to: string; label: string; }[];
}

let viz: any = new Viz({Module: () => Module({TOTAL_MEMORY: 1<<30}), render});

@observer
export class DotGraphViewer extends React.Component<{ data: GraphData }> {
    render() {
        const { nodes, edges } = this.props.data;
        const dotContent = `
            digraph MyGraph {
                ${nodes.map(n => `${n.id} [ label = ${JSON.stringify(n.label)} ];`).join("\n ")}
                ${edges.map(e => `${e.from} -> ${e.to} [ label = ${JSON.stringify(e.label)} ];`).join("\n")}
            }
        `;
        return (
            <DotViewer dotCode={dotContent} />
        );
    }
}

@observer
export class DotViewer extends React.Component<{ dotCode: string }> {
    @observable private svg: string|null = null;

    constructor(props) {
        super(props);
        autorun(async () => {
            const svg = await viz.renderString(this.props.dotCode);
            runInAction("Update svg", () => this.svg = svg);
        });
    }

    render() {
        if (!this.svg) {
            return (<div>Loading...</div>);
        }
        return (
            <SvgViewer svgContent={this.svg} />
        );
    }
}

function widthOrDefault(r: ContentRect): number {
    if (r.bounds && r.bounds.width) {
        return r.bounds.width;
    }
    return 1;
}

function heightOrDefault(r: ContentRect): number {
    if (r.bounds && r.bounds.height) {
        return r.bounds.height;
    }
    return 1;
}

export class SvgViewer extends React.Component<{ svgContent: string }, { tool: Tool }> {
    constructor(props) {
        super(props);
        this.state = { tool: "pan" };
    }

    private readonly setTool = (tool: Tool) => {
        this.setState({ tool });
    };

    render() {
        let { svgContent } = this.props;
        let width: number = 0;
        let height: number = 0;
        svgContent = svgContent.replace(/viewBox="[0-9\.]+ [0-9\.]+ ([0-9\.]+) ([0-9\.]+)"/, (r, w, h) => {
            width = parseFloat(w);
            height = parseFloat(h);
            return "";
        });
        //console.log(svgContent);
        return (
            <Measure bounds>
                {
                    ({ measureRef, contentRect }) => 
                    (
                        <div ref={measureRef} className="svgViewer">
                            <ReactSVGPanZoom
                                width={widthOrDefault(contentRect)}
                                height={heightOrDefault(contentRect)}
                                tool={this.state.tool}
                                onChangeTool={this.setTool}
                            >
                                <svg width={width} height={height}>
                                    <g dangerouslySetInnerHTML={{ __html: svgContent }} />
                                </svg>
                            </ReactSVGPanZoom>
                        </div>
                    )
                }
            </Measure>
        );
    }
}