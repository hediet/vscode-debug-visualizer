import { observable, computed, action, autorun, intercept, runInAction, values } from "mobx";
import Viz from 'viz.js';
import { Module, render } from 'viz.js/full.render.js';

let viz: any = new Viz({ Module, render });

export class ExpressionInputModel {
    @observable public editedExpression: string|null = "";
    @observable public expression: string = "";

    @action
    public readonly activateEditing = () => {
        this.editedExpression = this.expression;
    }

    @action
    public readonly setEditedExpression = (text: string) => {
        this.editedExpression = text;

    }

    @action
    public readonly finishEditing = () => {
        if (this.editedExpression) {
            this.expression = this.editedExpression;
            this.editedExpression = null;
        }
    }

    @action
    public readonly abortEditing = () => {
        this.editedExpression = null;
    }
}

interface Value {
    data: string;
}

type Data = SetValueCommand | SetExpressionCommand | { command: undefined; };

interface SetValueCommand {
    command: "setValue";
    value: Value;
}

interface SetExpressionCommand {
    command: "setExpression";
    expression: string;
}

export class Model {
    public readonly expressionInput = new ExpressionInputModel();
    @observable public value: Value | undefined = undefined;

    @observable public historyIndex: number = 0;
    @computed public get actualExpression(): string {
        return this.expressionInput.expression;
        //return this.expressionInput.expression.replace(/\$i/g, `${this.historyIndex}`);
    }

    constructor() {
        window.addEventListener("message", event => {
            const data = event.data as Data;
            if (data.command === "setValue") {
                runInAction("setValue", () => {
                    this.value = data.value;
                });
            }
            if (data.command === "setExpression") {
                runInAction("setExpression", () => {
                    this.expressionInput.editedExpression = data.expression ? null : "";
                    this.expressionInput.expression = data.expression;
                });
            }
        });

        window.parent.postMessage({ command: "initialized" }, "*");

        autorun(() => {
            setExpression(this.actualExpression);
        });
    }
}

function setExpression(expression: string) {
    window.parent.postMessage({ command: "setExpression", expression }, "*");
}

