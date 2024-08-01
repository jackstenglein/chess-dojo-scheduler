'use strict';

import {
    AttributeValue,
    DynamoDBClient,
    UpdateItemCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';

export const dynamo = new DynamoDBClient({ region: 'us-east-1' });
export const directoryTable = process.env.stage + '-directories';

type updateReturnType = 'NONE' | 'ALL_OLD' | 'UPDATED_OLD' | 'ALL_NEW' | 'UPDATED_NEW';

export class UpdateItemBuilder {
    private keys: Record<string, AttributeValue> = {};
    private _table: string = '';

    private attrIndex = 0;
    private exprAttrNames: Record<string, string> = {};
    private exprAttrValues: Record<string, AttributeValue> = {};
    private setExpression = '';
    private removeExpression = '';

    private _condition: Condition | undefined;
    private returnValues: updateReturnType = 'NONE';

    constructor() {}

    /**
     * Clears any previously set fields on the builder.
     */
    clear() {
        this.keys = {};
        this._table = '';

        this.attrIndex = 0;
        this.exprAttrNames = {};
        this.exprAttrValues = {};
        this.setExpression = '';
        this.removeExpression = '';

        this._condition = undefined;
        this.returnValues = 'NONE';
    }

    /**
     * Sets the value of the given key.
     * @param key The key to set.
     * @param value The value to set for the key.
     * @returns The UpdateItemBuilder for method chaining.
     */
    key(key: string, value: string): UpdateItemBuilder {
        this.keys[key] = { S: value };
        return this;
    }

    /**
     * Adds a command to set the given attribute to the given value.
     * If the value is undefined, it is ignored.
     * @param path The attribute path to set.
     * @param value The value to set.
     * @returns The UpdateItemBuilder for method chaining.
     */
    set(path: string, value: any): UpdateItemBuilder {
        if (value !== undefined) {
            if (this.setExpression.length > 0) {
                this.setExpression += ', ';
            }
            this.setExpression += this.addExpressionPath(path);
            this.setExpression += ` = :n${this.attrIndex}`;
            this.exprAttrValues[`:n${this.attrIndex}`] = marshall(value);
            this.attrIndex++;
        }
        return this;
    }

    /**
     * Adds a command to remove the given attribute path.
     * @param path The attribute path to remove
     * @returns The UpdateItemBuilder for method chaining.
     */
    remove(path: string): UpdateItemBuilder {
        if (this.removeExpression.length > 0) {
            this.removeExpression += ', ';
        }
        this.removeExpression += this.addExpressionPath(path);
        return this;
    }

    /**
     * Sets the condition expression to the given condition.
     * @param condition The condition to set.
     * @returns The UpdateItemBuilder for method chaining.
     */
    condition(condition: Condition): UpdateItemBuilder {
        this._condition = condition;
        return this;
    }

    /**
     * Sets the table name for the command.
     * @param table The table name.
     * @returns The UpdateItemBuilder for method chaining.
     */
    table(table: string): UpdateItemBuilder {
        this._table = table;
        return this;
    }

    /**
     * Sets the values to return when the update item request completes.
     * @param value The value to return.
     * @returns The UpdateItemBuilder for method chaining.
     */
    return(value: updateReturnType): UpdateItemBuilder {
        this.returnValues = value;
        return this;
    }

    /**
     * @returns An UpdateItemCommand with the previously set parameters.
     */
    build(): UpdateItemCommand {
        let updateExpression = '';

        if (this.setExpression.length > 0) {
            updateExpression += `SET ${this.setExpression}`;
        }
        if (this.removeExpression.length > 0) {
            updateExpression += ` REMOVE ${this.removeExpression}`;
        }

        return new UpdateItemCommand({
            Key: this.keys,
            UpdateExpression: updateExpression,
            ExpressionAttributeNames: this.exprAttrNames,
            ExpressionAttributeValues: this.exprAttrValues,
            ConditionExpression: this._condition?.build(this.exprAttrNames),
            ReturnValues: this.returnValues,
            TableName: this._table,
        });
    }

    /**
     * Converts the given attribute path into a DynamoDB-compliant path. The path is
     * split on the . character, and each component is converted into a DynamoDB
     * expression attribute name, which is added to the exprAttrNames object.
     * @param path The path to convert.
     * @returns The converted path.
     */
    private addExpressionPath(path: string) {
        const tokens = path.split('.');
        let result = '';

        for (const token of tokens) {
            result += `#n${this.attrIndex}.`;
            this.exprAttrNames[`#n${this.attrIndex}`] = token;
            this.attrIndex++;
        }

        return result.slice(0, result.length - 1);
    }
}

enum ConditionType {
    AttributeExists,
}

class Condition {
    private type: ConditionType;
    private operands: string[] = [];
    private attrIndex = 0;

    constructor(type: ConditionType, operands: string[]) {
        this.type = type;
        this.operands = operands;
    }

    build(exprAttrNames: Record<string, string>) {
        let expression = '';

        if (this.type === ConditionType.AttributeExists) {
            expression = `attribute_exists (${this.addExpressionPath(this.operands[0], exprAttrNames)})`;
        }

        return expression;
    }

    private addExpressionPath(path: string, exprAttrNames: Record<string, string>) {
        const tokens = path.split('.');
        let result = '';

        for (const token of tokens) {
            result += `#c${this.attrIndex}.`;
            exprAttrNames[`#c${this.attrIndex}`] = token;
            this.attrIndex++;
        }

        return result.slice(0, result.length - 1);
    }
}

export function attributeExists(path: string) {
    return new Condition(ConditionType.AttributeExists, [path]);
}
