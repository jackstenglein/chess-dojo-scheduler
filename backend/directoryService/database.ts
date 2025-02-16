'use strict';

import {
    AttributeValue,
    DynamoDBClient,
    UpdateItemCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { ApiError } from './api';

export const dynamo = new DynamoDBClient({ region: 'us-east-1' });
export const directoryTable = process.env.stage + '-directories';
export const gameTable = process.env.stage + '-games';

type updateReturnType = 'NONE' | 'ALL_OLD' | 'UPDATED_OLD' | 'ALL_NEW' | 'UPDATED_NEW';

type AttributePathTokens = (string | number)[];
export type AttributePath = string | AttributePathTokens;

export class UpdateItemBuilder {
    private keys: Record<string, AttributeValue> = {};
    private _table: string = '';

    private attrIndex = 0;
    private exprAttrNames: Record<string, string> = {};
    private reversedExprAttrNames: Record<string, string> = {};
    private exprAttrValues: Record<string, AttributeValue> = {};
    private setExpression = '';
    private removeExpression = '';
    private addExpression = '';

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
        this.reversedExprAttrNames = {};
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
     * If the value is undefined, this function is a no-op. If path is a string,
     * it will be split around the period character and each component will be
     * converted to a DynamoDB expression attribute name. If path is an array,
     * each item will be converted to a DynamoDB expression attribute name.
     * @param path The attribute path to set.
     * @param value The value to set.
     * @returns The UpdateItemBuilder for method chaining.
     */
    set(path: AttributePath, value: any): UpdateItemBuilder {
        if (value === undefined) {
            return this;
        }

        if (typeof path === 'string') {
            return this.setPath(path.split('.'), value);
        }
        return this.setPath(path, value);
    }

    /**
     * Adds a command to add the given value to the given attribute, which
     * must be a number or set. If path is a string, it will be split around
     * the period character and each component will be converted to a DynamoDB
     * expression attribute name. If path is an array, each item will be converted
     * to a DynamoDB expression attribute name.
     * @param path The attribute path to add to.
     * @param value The value to add. If undefined, this function is a no-op.
     * @returns The UpdateItemBuilder for method chaining.
     */
    add(path: AttributePath, value: any): UpdateItemBuilder {
        if (value === undefined) {
            return this;
        }

        if (typeof path === 'string') {
            return this.addPath(path.split(','), value);
        }
        return this.addPath(path, value);
    }

    /**
     * Adds a command to add the given value to the given attribute path, which
     * must be a number or set.
     * @param path The attribute path to add to.
     * @param value The value to add.
     * @returns The UpdateItemBuilder for method chaining.
     */
    private addPath(path: AttributePathTokens, value: any): UpdateItemBuilder {
        if (this.addExpression.length > 0) {
            this.addExpression += ', ';
        }
        this.addExpression += this.addExpressionPath(path);
        this.addExpression += ` :n${this.attrIndex}`;
        this.exprAttrValues[`:n${this.attrIndex}`] = marshall(value);
        this.attrIndex++;
        return this;
    }

    /**
     * Adds a command to set the given attribute path to the given value.
     * If the value is undefined, this function is a no-op.
     * @param path The attribute path to set.
     * @param value The value to set.
     * @returns The UpdateItemBuilder for method chaining.
     */
    private setPath(path: AttributePathTokens, value: any): UpdateItemBuilder {
        if (value === undefined) {
            return this;
        }

        if (this.setExpression.length > 0) {
            this.setExpression += ', ';
        }
        this.setExpression += this.addExpressionPath(path);
        this.setExpression += ` = :n${this.attrIndex}`;
        this.exprAttrValues[`:n${this.attrIndex}`] = marshall(value, {
            removeUndefinedValues: true,
            convertTopLevelContainer: true,
        });
        this.attrIndex++;
        return this;
    }

    /**
     * Adds a command to append the given values to the list specified by the given attribute path.
     * If path is a string, it will be split around the period character, and each component will be
     * converted to a DynamoDB expression attribute name. If path is an array, each item will be
     * converted to a DynamoDB expression attribute name. If the path does not already exist on the
     * item, it will be set to an empty list before performing the append.
     * @param path The attribute path to set.
     * @param values The values to append to the end of the list.
     * @returns The UpdateItemBuilder for method chaining.
     */
    appendToList(path: AttributePath, values: any[]): UpdateItemBuilder {
        if (this.setExpression.length > 0) {
            this.setExpression += ', ';
        }

        if (typeof path === 'string') {
            path = path.split('.');
        }

        const pathExpr = this.addExpressionPath(path);
        this.setExpression += `${pathExpr} = list_append(if_not_exists(${pathExpr}, :empty_list), :n${this.attrIndex})`;
        this.exprAttrValues[':empty_list'] = { L: [] };
        this.exprAttrValues[`:n${this.attrIndex}`] = marshall(values, {
            removeUndefinedValues: true,
            convertTopLevelContainer: true,
        });
        this.attrIndex++;
        return this;
    }

    /**
     * Adds a command to remove the given attribute path. If path is a string,
     * it will be split around the period character and each component converted
     * to a DynamoDB expression name attribute. If path is an array, each item
     * will be converted to a DynamoDB expression name attribute.
     * @param path The attribute path to remove.
     * @returns The UpdateItemBuilder for method chaining.
     */
    remove(path: AttributePath): UpdateItemBuilder {
        if (typeof path === 'string') {
            return this.removePath(path.split('.'));
        }
        return this.removePath(path);
    }

    /**
     * Adds a command to remove the given attribute path.
     * @param path The attribute path to remove.
     * @returns The UpdateItemBuilder for method chaining.
     */
    private removePath(path: AttributePathTokens): UpdateItemBuilder {
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
        if (this.addExpression.length > 0) {
            updateExpression += ` ADD ${this.addExpression}`;
        }

        return new UpdateItemCommand({
            Key: this.keys,
            UpdateExpression: updateExpression,
            ExpressionAttributeNames: this.exprAttrNames,
            ExpressionAttributeValues: this.exprAttrValues,
            ConditionExpression: this._condition?.build(
                this.exprAttrNames,
                this.exprAttrValues,
            ),
            ReturnValues: this.returnValues,
            TableName: this._table,
        });
    }

    /**
     * Converts the given attribute path into a DynamoDB-compliant path. Each item in the path
     * is converted into a DynamoDB expression attribute name, which is added to the exprAttrNames
     * object.
     * @param path The path to convert.
     * @returns The converted path.
     */
    private addExpressionPath(path: AttributePathTokens) {
        let result = '';

        for (const token of path) {
            if (typeof token === 'number') {
                result = result.slice(0, -1) + `[${token}].`;
            } else {
                if (this.reversedExprAttrNames[token]) {
                    result += `${this.reversedExprAttrNames[token]}.`;
                } else {
                    result += `#n${this.attrIndex}.`;
                    this.exprAttrNames[`#n${this.attrIndex}`] = token;
                    this.reversedExprAttrNames[token] = `#n${this.attrIndex}`;
                    this.attrIndex++;
                }
            }
        }

        return result.slice(0, -1);
    }
}

class Condition {
    protected attrIndex = 0;

    build(
        _exprAttrNames: Record<string, string>,
        _exprAttrValues: Record<string, AttributeValue>,
        _parentAttrIndex = '',
    ): string {
        throw new ApiError({
            statusCode: 500,
            publicMessage: 'Temporary server error',
            privateMessage: 'Using base Condition build function',
        });
    }

    protected addExpressionPath(
        path: AttributePathTokens,
        exprAttrNames: Record<string, string>,
        parentAttrIndex: string,
    ) {
        let result = '';

        for (const token of path) {
            if (typeof token === 'number') {
                result = result.slice(0, -1) + `[${token}].`;
            } else {
                result += `#c${parentAttrIndex}${this.attrIndex}.`;
                exprAttrNames[`#c${parentAttrIndex}${this.attrIndex}`] = token;
                this.attrIndex++;
            }
        }

        return result.slice(0, -1);
    }
}

class AndCondition extends Condition {
    private conditions: Condition[];

    constructor(...conditions: Condition[]) {
        super();
        this.conditions = conditions;
    }

    build(
        exprAttrNames: Record<string, string>,
        exprAttrValues: Record<string, AttributeValue>,
        parentAttrIndex = '',
    ) {
        const result = this.conditions
            .map((condition, index) =>
                condition.build(
                    exprAttrNames,
                    exprAttrValues,
                    `${parentAttrIndex}${index}`,
                ),
            )
            .join(' AND ');
        return `(${result})`;
    }
}

class AttributeExistsCondition extends Condition {
    private path: AttributePathTokens;

    constructor(path: AttributePath) {
        super();
        if (typeof path === 'string') {
            this.path = path.split('.');
        } else {
            this.path = path;
        }
    }

    build(
        exprAttrNames: Record<string, string>,
        _exprAttrValues: Record<string, AttributeValue>,
        parentAttrIndex = '',
    ) {
        return `attribute_exists (${this.addExpressionPath(this.path, exprAttrNames, parentAttrIndex)})`;
    }
}

class AttributeNotExistsCondition extends Condition {
    private path: AttributePathTokens;

    constructor(path: AttributePath) {
        super();
        if (typeof path === 'string') {
            this.path = path.split('.');
        } else {
            this.path = path;
        }
    }

    build(
        exprAttrNames: Record<string, string>,
        _exprAttrValues: Record<string, AttributeValue>,
        parentAttrIndex = '',
    ) {
        return `attribute_not_exists (${this.addExpressionPath(this.path, exprAttrNames, parentAttrIndex)})`;
    }
}

class EqualityCondition extends Condition {
    protected path: AttributePathTokens;
    protected value: any;
    protected comparator: '=' | '<>' | '<' | '<=' | '>' | '>=';

    constructor(
        path: AttributePath,
        value: any,
        comparator: '=' | '<>' | '<' | '<=' | '>' | '>=',
    ) {
        super();

        if (typeof path === 'string') {
            this.path = path.split('.');
        } else {
            this.path = path;
        }

        this.value = value;
        this.comparator = comparator;
    }

    build(
        exprAttrNames: Record<string, string>,
        exprAttrValues: Record<string, AttributeValue>,
        parentAttrIndex = '',
    ) {
        const valueName = `:c${parentAttrIndex}${this.attrIndex}`;
        this.attrIndex++;
        exprAttrValues[valueName] = marshall(this.value, { removeUndefinedValues: true });

        return `${this.addExpressionPath(this.path, exprAttrNames, parentAttrIndex)} ${this.comparator} ${valueName}`;
    }
}

class SizeCondition extends EqualityCondition {
    constructor(
        path: AttributePath,
        value: any,
        comparator: '=' | '<>' | '<' | '<=' | '>' | '>=',
    ) {
        super(path, value, comparator);
    }

    build(
        exprAttrNames: Record<string, string>,
        exprAttrValues: Record<string, AttributeValue>,
        parentAttrIndex = '',
    ) {
        const valueName = `:c${parentAttrIndex}${this.attrIndex}`;
        this.attrIndex++;
        exprAttrValues[valueName] = marshall(this.value, { removeUndefinedValues: true });

        return `size(${this.addExpressionPath(this.path, exprAttrNames, parentAttrIndex)}) ${this.comparator} ${valueName}`;
    }
}

/**
 * Returns a condition which verifies that two or more nested conditions are
 * all true.
 * @param conditions The conditions to verify.
 */
export function and(...conditions: Condition[]): Condition {
    return new AndCondition(...conditions);
}

/**
 * Returns a condition which verifies that the given attribute path
 * exists on the DynamoDB item.
 * @param path The path to check.
 */
export function attributeExists(path: AttributePath): Condition {
    return new AttributeExistsCondition(path);
}

/**
 * Returns a condition which verifies that the given attribute path
 * does not exist on the DynamoDB item.
 * @param path The path to check.
 */
export function attributeNotExists(path: AttributePath): Condition {
    return new AttributeNotExistsCondition(path);
}

/**
 * Returns a condition which verifies that the given attribute path
 * equals the given value.
 * @param path The path to check.
 * @param value The value to compare against.
 */
export function equal(path: AttributePath, value: any): Condition {
    return new EqualityCondition(path, value, '=');
}

/**
 * Returns a condition which verifies that the given attribute path
 * does not equal the given value.
 * @param path The path to check.
 * @param value The value to compare against.
 */
export function notEqual(path: AttributePath, value: any): Condition {
    return new EqualityCondition(path, value, '<>');
}

/**
 * Returns a condition which verifies that the attribute at the given
 * path has a size less than the given value.
 * @param path The path to check.
 * @param value The value to compare against.
 */
export function sizeLessThan(path: AttributePath, value: number): Condition {
    return new SizeCondition(path, value, '<');
}
