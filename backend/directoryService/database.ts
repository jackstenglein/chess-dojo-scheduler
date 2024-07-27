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
    #keys: Record<string, AttributeValue> = {};
    #table: string = '';
    #attrsToSet: Record<string, AttributeValue> = {};
    #condition: Condition | undefined;
    #returnValues: updateReturnType = 'NONE';

    constructor() {}

    /**
     * Clears any previously set fields on the builder.
     */
    clear() {
        this.#keys = {};
        this.#table = '';
        this.#attrsToSet = {};
        this.#condition = undefined;
        this.#returnValues = 'NONE';
    }

    /**
     * Sets the value of the given key.
     * @param key The key to set.
     * @param value The value to set for the key.
     * @returns The UpdateItemBuilder for method chaining.
     */
    key(key: string, value: string): UpdateItemBuilder {
        this.#keys[key] = { S: value };
        return this;
    }

    /**
     * Adds a command to set the given attribute to the given value.
     * If the value is undefined, it is ignored.
     * @param attr The attribute to set.
     * @param value The value to set.
     * @returns The UpdateItemBuilder for method chaining.
     */
    set(attr: string, value: any): UpdateItemBuilder {
        if (value !== undefined) {
            this.#attrsToSet[attr] = marshall(value);
        }
        return this;
    }

    /**
     * Sets the condition expression to the given condition.
     * @param condition The condition to set.
     * @returns The UpdateItemBuilder for method chaining.
     */
    condition(condition: Condition): UpdateItemBuilder {
        this.#condition = condition;
        return this;
    }

    /**
     * Sets the table name for the command.
     * @param table The table name.
     * @returns The UpdateItemBuilder for method chaining.
     */
    table(table: string): UpdateItemBuilder {
        this.#table = table;
        return this;
    }

    /**
     * Sets the values to return when the update item request completes.
     * @param value The value to return.
     * @returns The UpdateItemBuilder for method chaining.
     */
    return(value: updateReturnType): UpdateItemBuilder {
        this.#returnValues = value;
        return this;
    }

    /**
     * @returns An UpdateItemCommand with the previously set parameters.
     */
    build(): UpdateItemCommand {
        let updateExpression = '';
        const exprAttrNames: Record<string, string> = {};
        const exprAttrValues: Record<string, AttributeValue> = {};
        let attrIdx = 0;

        const setters = Object.entries(this.#attrsToSet);
        if (setters.length > 0) {
            updateExpression += 'SET ';
            for (const [name, value] of setters) {
                updateExpression += `#n${attrIdx} = :v${attrIdx}, `;
                exprAttrNames[`#n${attrIdx}`] = name;
                exprAttrValues[`:v${attrIdx}`] = value;
                attrIdx++;
            }
            updateExpression = updateExpression.slice(
                0,
                updateExpression.length - ', '.length,
            );
        }

        return new UpdateItemCommand({
            Key: this.#keys,
            UpdateExpression: updateExpression,
            ExpressionAttributeNames: exprAttrNames,
            ExpressionAttributeValues: exprAttrValues,
            ConditionExpression: this.#condition?.build(exprAttrNames),
            ReturnValues: this.#returnValues,
            TableName: this.#table,
        });
    }
}

enum ConditionType {
    AttributeExists,
}

class Condition {
    #type: ConditionType;
    #operands: string[] = [];

    constructor(type: ConditionType, operands: string[]) {
        this.#type = type;
        this.#operands = operands;
    }

    build(exprAttrNames: Record<string, string>) {
        let attrIndx = 0;
        let expression = '';

        if (this.#type === ConditionType.AttributeExists) {
            expression = `attribute_exists (#c${attrIndx})`;
            exprAttrNames[`#c${attrIndx}`] = this.#operands[0];
            attrIndx++;
        }

        return expression;
    }
}

export function attributeExists(path: string) {
    return new Condition(ConditionType.AttributeExists, [path]);
}
