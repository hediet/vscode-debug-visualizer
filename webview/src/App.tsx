import { observer } from "mobx-react";
import * as classNames from "classnames";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { ReactSVGPanZoom, Tool } from "react-svg-pan-zoom";
import { computed, observable, runInAction, action } from "mobx";
import Measure from "react-measure";
import { Model, ExpressionInputModel } from "./Model";
import { GraphData, DotGraphViewer, DotViewer } from "./DotGraphViewer";

const ENTER_KEYCODE = 13;
const ESCAPE = 27;

@observer
class ExpressionInput extends React.Component<{
    rootModel: Model;
    model: ExpressionInputModel;
}> {
    private ref: HTMLInputElement | null;
    private readonly inputTextChanged = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        this.props.model.setEditedExpression(event.target.value);
    };

    private readonly setRef = (ref: HTMLInputElement | null) => {
        if (ref) {
            ref.select();
        }
    };

    private readonly onInputKeyDown = (e: React.KeyboardEvent) => {
        if (e.keyCode === ENTER_KEYCODE) {
            e.preventDefault();
            this.props.model.finishEditing();
        } else if (e.keyCode === ESCAPE) {
            e.preventDefault();
            this.props.model.abortEditing();
        }
    };

    render() {
        const model = this.props.model;
        if (model.editedExpression !== null) {
            return (
                <input
                    ref={this.setRef}
                    className="expression-input"
                    value={model.editedExpression}
                    onChange={this.inputTextChanged}
                    onBlur={model.finishEditing}
                    onKeyDown={this.onInputKeyDown}
                />
            );
        } else {
            return (
                <div
                    className="expression"
                    onDoubleClick={model.activateEditing}
                >
                    {this.props.rootModel.actualExpression}
                </div>
            );
        }
    }
}

import {
    contract,
    types as t,
    requestContract,
    notificationContract,
    ConsoleRpcLogger
} from "@hediet/typed-json-rpc";
import { TypedWebSocketClientChannel } from "@hediet/typed-json-rpc-websocket";

const editorContract = contract({
    server: {
        highlightLine: requestContract({ params: { line: t.Integer } }),
        highlight: requestContract({
            params: {
                startLine: t.Integer,
                startCol: t.Integer,
                endLine: t.Integer,
                endCol: t.Integer
            }
        }),
        decorate: requestContract({
            params: {
                decos: t.array(t.type({ line: t.Integer, text: t.string }))
            }
        })
    },
    client: {}
});

@observer
export class HighlightLine extends React.Component<{ content: string }> {
    @observable localContent: string;

    constructor(props: HighlightLine["props"]) {
        super(props);
        this.localContent = props.content;
    }
    /*
    componentDidUpdate(props: this["props"]) {
        this.localContent = this.props.content;
    }*/

    async send() {
        const content = this.localContent.substr("highlight-line:".length);
        const lines = content.split("\n");

        const parts = lines[0].split(",");
        const startLine = parseInt(parts[0]) - 1;
        const startCol = parseInt(parts[1]) - 1;
        const endLine = parseInt(parts[2]) - 1;
        const endCol = parseInt(parts[3]);

        let decos = lines.splice(1).map(l => {
            const p = l.split(":");
            return {
                line: parseInt(p[0]) - 1,
                text: " " + p.splice(1).join(":")
            };
        });
        decos = decos.filter(d => !d.text.startsWith(" @"));

        console.log("send", startLine, decos);

        try {
            let channel = await TypedWebSocketClientChannel.connectTo(
                { address: "ws://localhost:56024" },
                new ConsoleRpcLogger()
            );
            const server = editorContract.getServerInterface(channel, {});
            channel.startListen();

            await server.highlight({ startLine, startCol, endLine, endCol });
            await server.decorate({ decos });
        } catch (exception) {
            console.log("could not contact vscode: ", exception);
        }
    }
    render() {
        this.send();
        return (
            <textarea
                value={this.localContent}
                onChange={e => (this.localContent = "" + e.target.value)}
            />
        );
    }
}

@observer
export class GUI extends React.Component<{ model: Model }, {}> {
    render() {
        const m = this.props.model;
        return (
            <div
                style={{
                    paddingTop: "0.5em",
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    boxSizing: "border-box"
                }}
                tabIndex={0}
                onKeyDown={e => {
                    if (e.keyCode === 39) {
                        m.historyIndex++;
                    } else if ((e.keyCode = 37)) {
                        m.historyIndex--;
                    }
                }}
            >
                <div style={{}}>
                    <ExpressionInput
                        rootModel={this.props.model}
                        model={this.props.model.expressionInput}
                    />
                </div>
                <hr style={{ width: "100%" }} />
                <div style={{ flex: "1", minHeight: "0px" }}>
                    {/* <input type="checkbox" onChange={e => this.props.model.expressionInput.isEditing = !!e.target.checked} /> */}
                    {m.value ? (
                        this.renderValue(m.value.data)
                    ) : (
                        <div>No Data</div>
                    )}
                </div>
            </div>
        );
    }

    private cachedValue: string;
    private cachedParts: string[];

    renderValue(value: string) {
        try {
            if (value.match(/"(.*)"/)) {
                value = value.substr(1, value.length - 2);
            }
            const data = JSON.parse(value);

            //console.log(value, (data as any).kind);
            if ((data as any).kind === "GraphData") {
                const value2 = data as GraphData;
                return <DotGraphViewer data={value2} />;
            }
        } catch (e) {
            console.error(value, e);
        }
        return value;

        try {
            let parsed = JSON.parse(`${value}`);

            if (parsed === "None") {
                return <textarea>None</textarea>;
            }

            if (parsed.startsWith("highlight-line:")) {
                return <HighlightLine content={parsed} />;
            }
        } catch (e) {
            console.error(e);
        }

        try {
            return <DotViewer dotCode={JSON.parse(`${value}`)} />;
        } catch (e) {
            console.error(value, e);
        }

        /*return <DotViewer dotCode={JSON.parse(`${value}`)} />;*/
        if (value !== this.cachedValue) {
            this.cachedParts = value
                .split("---------------------------")
                .filter(e => !!e);
            this.cachedValue = value;
            console.log(`updated ${this.cachedParts.length} parts`);
        }
        //console.log(value.substr(0, 10000));
        //console.log(`${this.cachedParts[0]}`);
        //console.log(`"${this.cachedParts[0]}"`);
        const idx = Math.max(
            1,
            Math.min(this.cachedParts.length - 2, this.props.model.historyIndex)
        );
        console.log(idx);
        return <DotViewer dotCode={JSON.parse(`"${this.cachedParts[idx]}"`)} />;

        return <div>{`${value.length}`}</div>;
    }
}
