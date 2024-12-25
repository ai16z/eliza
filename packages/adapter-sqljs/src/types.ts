type SqlValue = number | string | Uint8Array | null;
type ParamsObject = Record<string, SqlValue>;
type ParamsCallback = (obj: ParamsObject) => void;
type BindParams = SqlValue[] | ParamsObject | null;
interface QueryExecResult {
    columns: string[];
    values: SqlValue[][];
}

declare class StatementIterator
    implements Iterator<Statement>, Iterable<Statement>
{
    [Symbol.iterator](): Iterator<Statement>;
    getRemainingSQL(): string;
    next(): StatementIteratorResult;
}
interface StatementIteratorResult {
    /** `true` if there are no more available statements */
    done: boolean;
    /** the next available Statement (as returned by `Database.prepare`) */
    value: Statement;
}
declare class Statement {
    /**
     * Bind values to the parameters, after having reseted the statement. If
     * values is null, do nothing and return true.
     *
     * SQL statements can have parameters, named '?', '?NNN', ':VVV',
     * '@VVV', '$VVV', where NNN is a number and VVV a string. This function
     * binds these parameters to the given values.
     *
     * Warning: ':', '@', and '$' are included in the parameters names
     *
     * ### Value types
     *
     * |Javascript type|SQLite type|
     * |-|-|
     * |number|REAL, INTEGER|
     * |boolean|INTEGER|
     * |string|TEXT|
     * |Array, Uint8Array|BLOB|
     * |null|NULL|
     * @see [https://sql.js.org/documentation/Statement.html#["bind"]](https://sql.js.org/documentation/Statement.html#%5B%22bind%22%5D)
     *
     * @param values The values to bind
     */
    bind(values?: BindParams): boolean;

    /**
     * Free the memory used by the statement
     * @see [https://sql.js.org/documentation/Statement.html#["free"]](https://sql.js.org/documentation/Statement.html#%5B%22free%22%5D)
     */
    free(): boolean;

    /**
     * Free the memory allocated during parameter binding
     * @see [https://sql.js.org/documentation/Statement.html#["freemem"]](https://sql.js.org/documentation/Statement.html#%5B%22freemem%22%5D)
     */
    freemem(): void;

    /**
     * Get one row of results of a statement. If the first parameter is not
     * provided, step must have been called before.
     * @see [https://sql.js.org/documentation/Statement.html#["get"]](https://sql.js.org/documentation/Statement.html#%5B%22get%22%5D)
     *
     * @param params If set, the values will be bound to the statement
     * before it is executed
     */
    get(params?: BindParams): SqlValue[];

    /**
     * Get one row of result as a javascript object, associating column
     * names with their value in the current row
     * @see [https://sql.js.org/documentation/Statement.html#["getAsObject"]](https://sql.js.org/documentation/Statement.html#%5B%22getAsObject%22%5D)
     *
     * @param params If set, the values will be bound to the statement, and
     * it will be executed
     */
    getAsObject(params?: BindParams): ParamsObject;

    /**
     * Get the list of column names of a row of result of a statement.
     * @see [https://sql.js.org/documentation/Statement.html#["getColumnNames"]](https://sql.js.org/documentation/Statement.html#%5B%22getColumnNames%22%5D)
     */
    getColumnNames(): string[];

    /**
     * Get the SQLite's normalized version of the SQL string used in
     * preparing this statement. The meaning of "normalized" is not
     * well-defined: see
     * [the SQLite documentation](https://sqlite.org/c3ref/expanded_sql.html).
     * @see [https://sql.js.org/documentation/Statement.html#["getNormalizedSQL"]](https://sql.js.org/documentation/Statement.html#%5B%22getNormalizedSQL%22%5D)
     */
    getNormalizedSQL(): string;

    /**
     * Get the SQL string used in preparing this statement.
     * @see [https://sql.js.org/documentation/Statement.html#["getSQL"]](https://sql.js.org/documentation/Statement.html#%5B%22getSQL%22%5D)
     */
    getSQL(): string;

    /**
     * Reset a statement, so that its parameters can be bound to new
     * values. It also clears all previous bindings, freeing the memory used
     * by bound parameters.
     * @see [https://sql.js.org/documentation/Statement.html#["reset"]](https://sql.js.org/documentation/Statement.html#%5B%22reset%22%5D)
     */
    reset(): void;

    /**
     * Shorthand for bind + step + reset Bind the values, execute the
     * statement, ignoring the rows it returns, and resets it
     * @param values Value to bind to the statement
     */
    run(values?: BindParams): void;

    /**
     * Execute the statement, fetching the next line of result, that can
     * be retrieved with `Statement.get`.
     * @see [https://sql.js.org/documentation/Statement.html#["step"]](https://sql.js.org/documentation/Statement.html#%5B%22step%22%5D)
     */
    step(): boolean;
}
export declare class Database {
    constructor(data?: ArrayLike<number> | Buffer | null);

    close(): void;

    create_function(name: string, func: (...args: any[]) => any): Database;

    each(
        sql: string,
        params: BindParams,
        callback: ParamsCallback,
        done: () => void
    ): Database;
    each(sql: string, callback: ParamsCallback, done: () => void): Database; // eslint-disable-line

    /**
     * Execute an SQL query, and returns the result.
     *
     * This is a wrapper against `Database.prepare`, `Statement.bind`, `Statement.step`, `Statement.get`, and `Statement.free`.
     *
     * The result is an array of result elements. There are as many result elements as the number of statements in your sql string (statements are separated by a semicolon)
     * @see [https://sql.js.org/documentation/Database.html#["exec"]](https://sql.js.org/documentation/Database.html#%5B%22exec%22%5D)
     *
     * @param sql a string containing some SQL text to execute
     * @param params When the SQL statement contains placeholders, you can
     * pass them in here. They will be bound to the statement before it is
     * executed. If you use the params argument as an array, you **cannot**
     * provide an sql string that contains several statements (separated by
     * `;`). This limitation does not apply to params as an object.
     */
    exec(sql: string, params?: BindParams): QueryExecResult[];

    /**
     * Exports the contents of the database to a binary array
     * @see [https://sql.js.org/documentation/Database.html#["export"]](https://sql.js.org/documentation/Database.html#%5B%22export%22%5D)
     */
    export(): Uint8Array;

    /**
     * Returns the number of changed rows (modified, inserted or deleted) by
     * the latest completed `INSERT`, `UPDATE` or `DELETE` statement on the
     * database. Executing any other type of SQL statement does not modify
     * the value returned by this function.
     * @see [https://sql.js.org/documentation/Database.html#["getRowsModified"]](https://sql.js.org/documentation/Database.html#%5B%22getRowsModified%22%5D)
     */
    getRowsModified(): number;

    /**
     * Analyze a result code, return null if no error occurred, and throw an
     * error with a descriptive message otherwise
     * @see [https://sql.js.org/documentation/Database.html#["handleError"]](https://sql.js.org/documentation/Database.html#%5B%22handleError%22%5D)
     */
    handleError(): null | never;

    /**
     * Iterate over multiple SQL statements in a SQL string. This function
     * returns an iterator over Statement objects. You can use a `for..of`
     * loop to execute the returned statements one by one.
     * @see [https://sql.js.org/documentation/Database.html#["iterateStatements"]](https://sql.js.org/documentation/Database.html#%5B%22iterateStatements%22%5D)
     *
     * @param sql a string of SQL that can contain multiple statements
     */
    iterateStatements(sql: string): StatementIterator;

    /**
     * Prepare an SQL statement
     * @see [https://sql.js.org/documentation/Database.html#["prepare"]](https://sql.js.org/documentation/Database.html#%5B%22prepare%22%5D)
     *
     * @param sql a string of SQL, that can contain placeholders (`?`, `:VVV`, `:AAA`, `@AAA`)
     * @param params values to bind to placeholders
     */
    prepare(sql: string, params?: BindParams): Statement;

    /**
     * Execute an SQL query, ignoring the rows it returns.
     * @see [https://sql.js.org/documentation/Database.html#["run"]](https://sql.js.org/documentation/Database.html#%5B%22run%22%5D)
     *
     * @param sql a string containing some SQL text to execute
     * @param params When the SQL statement contains placeholders, you can
     * pass them in here. They will be bound to the statement before it is
     * executed. If you use the params argument as an array, you **cannot**
     * provide an sql string that contains several statements (separated by
     * `;`). This limitation does not apply to params as an object.
     */
    run(sql: string, params?: BindParams): Database;
}
