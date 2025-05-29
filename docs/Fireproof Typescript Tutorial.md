# Fireproof Typescript Tutorial

This newbie-friendly tutorial explains the fireproof API and how to use it in a Typescript project. It is accompanied by code that gives a running start to your own learning and experimentation. As you go through this tutorial, simply uncomment relevant parts of the code and observe the results.

## Installation

Fireproof can be installed with NPM as follows

```sh
npm install @fireproof/core
```

If you want to play with the code used as the basis for this tutorial, you can clone the the Github repo with

```sh
git clone git@github.com:sagarbehere/fireproof-api-playground.git
```

Then run the following commands:

```sh
cd fireproof-api-playground
npm install
npm run dev
```

Now, use your browser to visit the URL mentioned in the output of `npm run dev`. It'll be something like `http://localhost:5173` although the port number (the number after the : ) may be different in your case.

### Using https

If all you are doing is accessing the fireproof app over `http://localhost` or `http://127.0.0.1` then you do not need https. For all other cases, a Fireproof app needs to be accessed over `https://`.

Even on your local computer, if you try to access the app by typing e.g.  `http://192.168.1.10:<port>` (where `192.168.1.10` is your computer's local network interface address) in your browser, it will **not work**.

See the doc [Serving over https](./Serving%20over%20https.md) to see one way of serving your app over https.

## Imports

You will typically want to have at least the following two lines in your imports

```typescript
import { fireproof } from '@fireproof/core';
import type { DocResponse, Database, DocWithId, IndexRow, IndexRows } from '@fireproof/core';
```

We will mention relevant types throughout this tutorial. You will need to adjust the imported types as needed in your code. For now, it would be useful to know that most of the type definitions are in the source file `src/types.ts` in the [fireproof github source repository](https://github.com/fireproof-storage/fireproof/tree/main). You may need to refer to these type definitions as you figure out the fireproof APIs. While Typescript, as well as your IDE, can and will infer many of the types, they are made explicit at most places in this document to aid your understanding.

NOTE: Speaking of source code, much of the API usage below has been figured out by looking at the code files in `tests/fireproof/` in the fireproof github source repository. In particular, `hello.test.ts`, `fireproof.test.ts`, and `database.test.ts` are instructive. You may need to refer to the code there as you figure out the fireproof APIs.

## Connecting to the database

Connecting to the database is the first API call you should make and a prerequisite to using the rest of the API. You may see the word 'ledger' instead of 'database' in various places. In Fireproof's context, these terms are used interchangeably - 'ledger' refers to the underlying data structure that provides the database capabilities. Connecting to the database is as simple as

```typescript
const db : Database = fireproof('my-database');
```

The function signature is: `fireproof(name: string, opts?: ConfigOpts): Database`

- The function definition is in the `src/ledger.ts` file in the source tree. The interface definition of type `Database` is in `src/types.ts`.
- The `my-database` string argument in the above example can be any arbitrary string of your choice and is the name of the database that gets created
  - In case you ever need to retrieve the name string, it is available in `db.name`
- There is an optional configuration object of type `ConfigOpts` that can be passed as an argument.
  - `ConfigOpts` is defined in `src/types.ts` and has a whole bunch of possible parameters
  - One possible parameter mentioned in the official documentation is `public?: boolean` , which leads to a statement like  `const db = fireproof('my-database', { public: true });`
    - The official documentation notes that passing `{public: true }` bypasses encryption and that _"..this is useful for creating a database that you want to share with other users."_
    - According to the encryption documentation, setting `{ public: true }` does disable encryption. The docs state: "This functionality allows you to create unencrypted ledger files for publishing." This is particularly useful for content-delivery workloads or during testing and development.
  - Other notable configuration options include:
    - `autoCompact?: number`: Controls automatic compaction of the database. When set to a number, it represents the threshold (in number of operations) after which automatic compaction occurs.
    - `prefix?: string`: Allows you to specify a custom prefix for storage keys.
    - `storage?: StorageAdapter`: Lets you provide a custom storage adapter implementation.
    - `headers?: Object`: When using remote storage, this allows you to set custom HTTP headers.
- Additional important API methods include:
  - `close()`: Closes the database connection and releases resources. It's good practice to call this when you're done with the database, particularly in single-page applications to prevent memory leaks.
  - `destroy()`: Completely removes the database and all its data. Use with caution.
  - `onClosed(fn: () => void): void`: Registers a callback function that will be executed when the database is closed. This is useful for cleanup operations or releasing resources that depend on the database.
- Note that while some documentation suggests the database name is optional, the TypeScript interface requires it. If you want an in-memory database that doesn't persist, you can use a unique or random name and avoid setting up persistence options.

## Adding and retrieving data

Data is added/retrieved to/from the database in the form of "documents". A document is basically a Javascript/JSON object i.e. something like `{ key1: value1, key2: value2 }` where the values can themselves be objects, thus allowing arbitrarily nested data to be added to the database.

### Adding data

The method for adding a document to the database is `db.put()` and it is used as follows:

```typescript
const ok: DocResponse = await db.put({ hello: "world"});
```

- Note that if your document does not have a property named `_id` with a string value e.g. `{_id: "foobar", hello: "world"}`, then fireproof will automatically add an `_id` property and generate a random string value for it.
- The return value of `db.put()` is a `Promise<DocResponse>`. A `DocResponse` object is defined in `src/types.ts` as containing `{id: string; clock: ClockHead; name?: string;}`.
  - `ok.id`  contains the value of the (possibly auto-added by fireproof) `_id` property of the added document.
  - `ok.name`, if it exists, will contain the name of the database 

A slightly more comprehensive practical example of adding data is shown in the code fragment below

```typescript
import { v4 as uuidv4 } from 'uuid';
import { fireproof } from '@fireproof/core';
import type { DocResponse, Database, DocWithId, IndexRow, IndexRows, AllDocsResponse } from '@fireproof/core';

const db: Database = fireproof('my-database');
let docId: string = '';

interface TodoItem {
  type: 'TodoItem';
  _id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date | null;
  tags: string[];
};

const myTodoItem1: TodoItem = {
  type = 'TodoItem',
  //_id: uuidv4(),
  _id: 'unique-id-1',
  title: 'My first todo item',
  completed: false,
  createdAt: new Date(),
  updatedAt: null,
  tags: ['example', 'first']
};

try {
  const response: DocResponse = await db.put(myTodoItem1);
  console.log('Successfully put document with id:', response.id);
  docId = response.id;
} catch (error: Error | unknown) {
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    } else {
      console.error('Error:', String(error));
    }
};
```

TODO: Is there something incorrect or 'could be better' in the above example code?

The return value of `db.put()` will be similar to what is shown below:

```json
db.put() returned the following:

{
  "id": "unique-id-1",
  "clock": [
    {
      "/": "bafyreifktuoloukjpvuwcbo2fc2kfu7t5lmkekiiktssgsopxrynp7k2zq"
    }
  ],
  "name": "my-database"
}
```

The sample code accompanying this tutorial adds 3 more TodoItems to the database. These will be useful when tinkering with the other API calls covered in this tutorial.

### Retrieving data

There are a few different ways of retrieving data from a fireproof database. In this section we will look at the simplest one, which is `db.get()`. Later in this tutorial we will look at more sophisticated methods.

`db.get()` is used as follows (continuing with our example from the previous section):

```typescript
if (docId != '') {
  try {
    const myDoc: DocWithId<TodoItem> = await db.get(docId);
    console.log('Successfully retrieved document with id:', myDoc._id);
    // You can practically treat myDoc as the document of type TodoItem that you put in previously. It might have some additional properties like _id, _delete etc.
  } catch (error: Error | unknown) {
      if (error instanceof Error) {
        console.error('Error message:', error.message);
      } else {
        console.error('Error:', String(error));
      }
  }
};
```

There are a few things going on here

- Firstly, note the `id: string` argument of the function call `db.get(id: string)`. This argument is the value of the `_id` property of the document you want to retrieve. 
  - Remember that if the document you passed to `db.put()` did not already contain an `_id: string` property:value pair, Fireproof would have added it to your document and the generated value of `_id` was returned as the `.id` field of `db.put()`'s return value (`response.id` in the code example in the previous section). 
  - In general, you will need to find or track or store the `_id`'s of any docs you might wish to later retrieve via `db.get()`.
- The return type of `db.get()` should be understood properly
  - The function signature actually is: `get<T extends DocTypes>(id: string): Promise<DocWithId<T>>;`
  - The explanation of that signature is: If you added a document/object of type T (where T may not be `null` or `undefined`) into the database, and are trying to retrieve it by passing its `_id` to `db.get()` , you will get back an object of type `DocWithId<T>`. 
  - Why does `db.get()` return an object of type `DocWithId<T>` instead of the type `T` that you put in? The brief explanation is that you can think of `DocWithId<T>` as your object of type `T` alongwith some additional properties like `_id` (which Fireproof would have added, in case it was missing) or, in some cases, a property named `_delete` (which we will talk about later in this tutorial). Fireproof may also add properties named `_files` and `_publicFiles` and, probably others in later versions.
  - In a practical sense, you can treat the returned value of type `DocWithId<T>` as being the same as type `T` that you previously added into the database, plus the guaranteed `_id` field and possibly other metadata fields. It's a superset of your original document type, ensuring that you always have access to the required Fireproof metadata.

The return value of `db.get()` in the above code fragment is similar to what is shown below (This will be shown in the browser, if you are playing with the sample code accompanying this tutorial)

```json
db.get() returned the following:

{
  "_id": "unique-id-1",
  "tags": [
    "example",
    "first"
  ],
  "type": "TodoItem",
  "title": "My first todo item",
  "completed": false,
  "createdAt": "2025-05-26T16:32:56.910Z",
  "updatedAt": null
}
```

## Deleting data

Deleting a document from the database is straightforward, once you know its `_id`.

```typescript
const response: DocResponse = await db.del(docId);
```

The return type of `DocResponse` is the same as what `db.put()` returns. The value of response in the above line of code will be something like the below:

```json
db.del() returned the following:

{
  "id": "unique-id-3",
  "clock": [
    {
      "/": "bafyreifp2ibbijooqso3r54h2z3w4upae7ir3cvfojrlurphwqfj7ojcre"
    }
  ],
  "name": "my-database"
}
```

Now here is an interesting bit. The database is immutable, so the document is not _actually_ deleted. What happens instead is that fireproof marks the document as deleted by adding a `_deleted: true` property:value pair to the document.

When a document is marked as deleted, it will not be retrieved by a call to `db.get()`. In this case, `db.get()` will throw an error containing the message "Not found: the-doc-id". HOWEVER, be careful! Some other methods of retrieving data _will_ return a mangled form of the deleted document (see the section on `db.allDocs()` below).

NOTE: If a document is deleted by a call to `db.del()` and you later `db.put()` it back into the database (see next section on updating previously added documents) after setting `_deleted: false`, that document gets un-deleted. 

The fact that the database is immutable means that its content can never be deleted. The database keeps growing. This means the size of your browser's IndexedDB, which is the in-browser persistent store for the database, will keep growing monotonically. The underlying data model makes it possible to leave the tail of the database behind in some cloud archive, but that functionality has not yet been written. In practice, a database slows down at about ˜100,000 records. It is expected that in the longer run, this limit would be more like a working set size and cold data would be stored only in the cloud.

In the example code accompanying this tutorial, we first add 4 documents to the database. Then, we delete the 3rd document. We'll see the impact of deleting this doc in later sections of this tutorial.

## Updating data

Updating/modifying a document that is previously added to the database is also straightforward when you know its id. Just call `db.put()` again with the same `_id` while modifying other parts of the document. 

Continuing with the previous example (without error checking code for simplicity)

```typescript
let tmpDoc = await db.get(docId);
await db.put({...tmpDoc, title: 'Updated title'});
tmpDoc = await db.get(docId);
await db.put({...tmpDoc, completed: true});
```

## Getting all data

Getting all the data in the database is done with `db.allDocs()`.

If you look at the code accompanying this tutorial, we have added 4 documents and then deleted one of them. Let's see what happens when we run the code below

```typescript
const allDocs: AllDocsResponse<TodoItem> = await db.allDocs();
```

The result is:

```json
db.allDocs() returned the following:

{
  "rows": [
    {
      "key": "unique-id-1",
      "value": {
        "_id": "unique-id-1",
        "tags": [
          "example",
          "first"
        ],
        "type": "TodoItem",
        "title": "My first todo item",
        "completed": false,
        "createdAt": "2025-05-26T16:42:27.327Z",
        "updatedAt": null
      }
    },
    {
      "key": "unique-id-2",
      "value": {
        "_id": "unique-id-2",
        "tags": [
          "example",
          "second"
        ],
        "type": "TodoItem",
        "title": "My second todo item",
        "completed": true,
        "createdAt": "2025-05-26T16:42:27.327Z",
        "updatedAt": null
      }
    },
    {
      "key": "unique-id-3",
      "value": {
        "_id": "unique-id-3",
        "_deleted": true
      }
    },
    {
      "key": "unique-id-4",
      "value": {
        "_id": "unique-id-4",
        "tags": [
          "example",
          "fourth"
        ],
        "type": "TodoItem",
        "title": "My fourth todo item",
        "completed": true,
        "createdAt": "2025-05-26T16:42:27.327Z",
        "updatedAt": null
      }
    }
  ],
  "clock": [
    {
      "/": "bafyreietznc2zo5ierlsvq5yra6wze3mp6vpxzxz6n3kp7z3cya5xbvo4a"
    }
  ],
  "name": "my-database"
}
```

There are a few things to note

- The returned value is a Promise of type `AllDocsResponse<TodoItem`. This return type is defined in `src/types.ts` as follows: 

  - ```typescript
    export interface AllDocsResponse<T extends DocTypes> {
      readonly rows: {
        readonly key: string;
        readonly value: DocWithId<T>;
      }[];
      readonly clock: ClockHead;
      readonly name?: string;
    }
    ```

  - So the main content is in the `.rows` property/member of the returned value. This is an array of objects where each object corresponds to a document in the database. The value of the document's `_id` is in the `key` property and the entirety of the document is in the `value` property which has the same `DocWithId<T>` type we saw in `db.get()` above.

  - You can access the returned docs using a code fragment like
    ```
    for (const row of allDocs.rows) {
        console.log('Row ID:', row.key, 'Row Value:', row.value);
      }
    ```

- Do you see something unusual in the output of allDocs() above?

  - The sample code deletes the doc with `id: unique-id-3` but it still shows up in the return value of `db.allDocs()` in a slightly mangled form. Only the `_id` and `_deleted: true` are present in the `value` property.
  - This behavior is intentional and follows the pattern of other document databases like CouchDB. It's useful for replication purposes, as it allows the deleted state to be synchronized across multiple databases. It also preserves the history of documents and enables features like conflict resolution or undeleting documents later.

- The type definition at `src/types.ts` defines the function signature as `allDocs<T extends DocTypes>(opts?: AllDocsQueryOpts): Promise<AllDocsResponse<T>>;`

  - Which implies that it should be possible to pass a query options object of type `AllDocsQueryOpts` as an argument.

  - The `src/types.h` file defines `AllDocsQueryOpts` as 
    ```typescript
    export interface AllDocsQueryOpts extends QueryOpts<string> {
      readonly key?: string;
      readonly keys?: string[];
      prefix?: string;
    }
    ```

  - We will look at query options in the next section. While the official documentation doesn't specifically detail query options for `allDocs()`, the interface allows for options similar to those in `query()`. You can use options like `{key: 'unique-id-1'}` to filter by a specific document ID, or `{limit: 10, descending: true}` to control the number and order of results.

## Querying data

Having looked at `db.get()` and `db.allDocs()`, we will now look at a more flexible and sophisticated way of retrieving data from the database. This is the `db.query()` method.

The `db.query()` function accepts two arguments:

- The first argument can be either i) A simple string value, or ii) A so-called "Map Function"
  - Just for now, let's ignore the case where the first argument is a "Map Function" (we will discuss this later).
  - If the first argument is a string value e.g. 'title', the query will return all documents that have a 'title' property

- The second argument is a so-called "options object". This is an object that can contain some specific key:value pairs as shown below, each of which affects the results of the query in a certain way. Glance through the possible items in the options object below, but don't worry too much about them just yet.

  - ```typescript
    export interface QueryOpts<K extends IndexKeyType> {
      readonly descending?: boolean; // Sort query results in descending order
      readonly limit?: number; // Maximum number of results
      includeDocs?: boolean; // Include full documents in the query result? Default true 
      readonly range?: [IndexKeyType, IndexKeyType]; //Query within a key range
      readonly key?: DocFragment; // Query for exact key match
      readonly keys?: DocFragment[]; // Query for multiple exact keys
      prefix?: IndexKeyType; // Query for keys with prefix
    }
    ```

Let's start with the simplest invocation of `db.query()` and then we will build up to progressively more complex invocations.

### Basic queries

The simplest way to use `db.query()` is to pass it a single string argument which is the name of a property/key in the type of documents you want to retrieve. Fireproof will then return all documents that have this key. So the line of code below will return all documents in the database that have a property/key named 'completed' (which should be _all_ of the 4 documents we have `db.put()` into the database.)

```typescript
const queryResult = await db.query('completed');
```

The content of `queryResult` is as follows, for the sample code accompanying this tutorial:

```json
Query Result

{
  "rows": [
    {
      "key": false,
      "id": "unique-id-1",
      "value": null,
      "doc": {
        "_id": "unique-id-1",
        "tags": [
          "example",
          "first"
        ],
        "type": "TodoItem",
        "title": "My first todo item",
        "completed": false,
        "createdAt": "2025-05-26T21:45:03.589Z",
        "updatedAt": null
      }
    },
    {
      "key": true,
      "id": "unique-id-2",
      "value": null,
      "doc": {
        "_id": "unique-id-2",
        "tags": [
          "example",
          "second"
        ],
        "type": "TodoItem",
        "title": "My second todo item",
        "completed": true,
        "createdAt": "2025-05-26T21:45:03.589Z",
        "updatedAt": null
      }
    },
    {
      "key": true,
      "id": "unique-id-4",
      "value": null,
      "doc": {
        "_id": "unique-id-4",
        "tags": [
          "example",
          "fourth"
        ],
        "type": "TodoItem",
        "title": "My fourth todo item",
        "completed": true,
        "createdAt": "2025-05-26T21:45:03.589Z",
        "updatedAt": null
      }
    }
  ]
}
```

Study this output carefully. Some things to note are:

- The value returned by `db.query()` is an object with a single property named `rows`. This is an array of objects. Each object in the array corresponds to a document in the db that has matched the query criteria. Each such object has properties `key`, `id`, `value`, and `doc`
  - `key` contains the value of the property name passed as the argument to `db.query()`. So in this case, it contains the true or false boolean values of the 'completed' property of each document (todo item) in the database.
  - `id` contains the value of the `_id` property of the document
  - `value` Ignore for now. We will get back to this shortly.
  - `doc` is an optional property and, if present, is the actual document that matched the query criteria. This will be of the type `DocWithId<t>` that we have seen before.
    - As you may have guessed, whether this property is present or absent depends on whether `{includeDocs: }`  has value of `true` (the default) or `false` in the options object that is the second argument to `db.query()`
  - If the property name passed to `db.query()` does not exist in any doc in the database, the resulting `rows` object will be an empty array.
- The doc with `_id: unique-id-3` which we had deleted is _not_ present in the results. This behavior is consistent with the behavior of `db.get()` but is different from the behavior of `db.allDocs()` which had returned a mangled form of the deleted document in its results.
- The results are sorted by the value of the `"key":` by default in ascending order. This is consistent with the query behavior described in the documentation, where results are sorted by the index field (similar to CouchDB's behavior).

Now let's run the following query in order to avoid having the entire doc included in the result. This will shorten the query results that we will have to look at, in the rest of this section.

```typescript
const queryResult = await db.query('completed', {includeDocs: false});
```

The result is shown below

```json
Query Result

{
  "rows": [
    {
      "key": false,
      "id": "unique-id-1",
      "value": null
    },
    {
      "key": true,
      "id": "unique-id-2",
      "value": null
    },
    {
      "key": true,
      "id": "unique-id-4",
      "value": null
    }
  ]
}
```

This result is far more concise and easy to look at. We'll see how this result changes as we continue to play with different `db.query()` arguments.

Now, let's run the same `db.query('completed')` call but include the optional query options argument with `{key: true, includeDocs: false}` . The return value should then include only those documents which i) have a property named 'completed' and ii) That property has value `true`.

```typescript
const queryResult = await db.query('completed', {key: true, includeDocs: false});
```

The output is

```json
Query Result

{
  "rows": [
    {
      "key": true,
      "id": "unique-id-2",
      "row": null
    },
    {
      "key": true,
      "id": "unique-id-4",
      "row": null
    }
  ]
}
```

- That seems to be working. The output only contains non-deleted documents with `completed: true`. 

- NOTE: The content of the returned value has changed! Instead of having a property named `value: null` as in the previous result, this result has the property `row: null`. This appears to be an inconsistency in the API implementation. When using certain query options like `key` or `keys`, the output format might change slightly. The important fields to focus on are `key` and `id`, which remain consistent.

Just for fun, let's try setting the filter option to `false`. This should return only one document, with `_id: unique-id-1` which has `completed: false`.

```typescript
const queryResult = await db.query('completed', {key: false, includeDocs: false});
```

And the output is

```json
Query Result

{
  "rows": [
    {
      "key": false,
      "id": "unique-id-1",
      "value": null
    },
    {
      "key": true,
      "id": "unique-id-2",
      "value": null
    },
    {
      "key": true,
      "id": "unique-id-4",
      "value": null
    }
  ]
}
```

- The inconsistent behavior when using `key: false` versus `keys: [false]` highlights an implementation detail in Fireproof's query system. When using `key: false`, you're looking for an exact match on the boolean value `false`. However, due to JavaScript's type coercion in some contexts, this might not work as expected with boolean values.
- Using `keys: [false]` is more explicit and works reliably for boolean values. This is the recommended approach when querying for boolean values.
- The switching between `value: null` and `row: null` in the output appears to be an inconsistency in the internal implementation that doesn't affect the functionality but might be confusing.

Now, let's run the following query which should return docs whose `completed` property has a value of either `true` or `false`. We do this by passing a `keys: ` property in the query options object with a value that is an array. The array's contents are the possible exact matches we are looking for. This is correct - the `keys: []` parameter allows you to specify multiple possible values that you want to match against the index key.

This should return all the non-deleted documents, since the `completed` property is a boolean.

```typescript
const queryResult = await db.query('completed', {keys: [true, false], includeDocs: false});
```

The result is indeed all the documents

```json
Query Result

{
  "rows": [
    {
      "key": true,
      "id": "unique-id-2",
      "row": null
    },
    {
      "key": true,
      "id": "unique-id-4",
      "row": null
    },
    {
      "key": false,
      "id": "unique-id-1",
      "row": null
    }
  ]
}
```

Observe:

- The inconsistency between `value: null` and `row: null` in the query results appears to be an implementation detail or possibly a bug in the current version. The key functionality is not affected, but be aware of this inconsistency when processing results.
- Regarding the sorting order: When using `keys: [true, false]`, the results are returned in the order specified in the keys array rather than being sorted by the natural order of the key values. This is because you're explicitly asking for multiple specific keys in a particular order. The `descending` option may not affect results in this case because the explicit `keys` parameter takes precedence.

Now let's include `limit: 1` in the options object in the above call. This option specifies the maximum number of results that should be returned by the query

```typescript
const queryResult = await db.query('completed', {keys: [true, false], includeDocs: false, limit: 1});
```

And the result is

```json
Query Result

{
  "rows": [
    {
      "key": true,
      "id": "unique-id-2",
      "row": null
    },
    {
      "key": false,
      "id": "unique-id-1",
      "row": null
    }
  ]
}
```

- The behavior with `limit` when using multiple keys is a quirk of the implementation. When using `keys: [true, false]`, the `limit` is applied per key value rather than to the total result set. So `limit: 1` means "return up to 1 document for each key value" rather than "return 1 document total".
- When no explicit `descending` option is provided, the default is `descending: false` (ascending order). Results are sorted by the key value first, then by document ID if multiple documents have the same key value.

Let's now try to find all documents where the title starts with 'My'. This should return all the documents in the database, since all of them have titles starting with 'My'

```typescript
const queryResult = await db.query('title', {prefix: 'My'});
```

The result is

```json
Query Result

{
  "rows": []
}
```

- The prefix query doesn't work as expected here because of how the prefix matching works in Fireproof. The `prefix` option is designed to work primarily with array keys or with specialized indexing. It's particularly useful with array indices (as shown in the documentation with year/month/day grouping).
- For simple string prefix matching on a single field, you would typically use a custom map function that implements the prefix logic or use the `range` option with start and end points that cover your prefix range.

- The documentation mentions `startkey` for pagination, but this may be a feature that's planned or implemented differently than described. In the current implementation, pagination can be achieved using:
  1. The `limit` option to control how many results are returned
  2. Tracking the last key seen in a result set
  3. Using `range` to start from after the last seen key in subsequent queries

  For example: `{ range: [lastSeenKey, undefined], limit: 10 }`
  
  The default sort order when no `descending` option is specified is ascending (alphabetical/numerical order).

Alright! So far, we have only experimented with the case where the first argument to `db.query()` is a simple string value. Let's switch to the case where the first argument is a function.

### Querying with a Map Function

Instead of a simple string value, the first argument of `db.query()` can also be a so-called "map function".

The map function has type signature `export type MapFn<T extends DocTypes> = (doc: DocWithId<T>, emit: EmitFn) => DocFragment | unknown;`

- The map function has two arguments. 
- The first argument is a `doc: DocWithId<T>`. You should be familiar with this type by now. Basically, the map function is called on every document in the database and the document is passed as the first argument.
- The second argument is a so-called emit() function. Let's ignore it for now. We'll get back to it a bit later in this tutorial.
  - The map function works without explicitly using the second argument because JavaScript doesn't enforce arity checking - you can define a function with parameters but not use all of them. In Fireproof's implementation, the emit function is always provided to the map function internally, but you're not required to use it. If you don't use emit, the function's return value is used instead.

- The return value of the map function is ... interesting! Well, let's just look at some examples and it'll become clear.

Let's make a query with a very simple map function that simply returns one of the properties of the document. In this case, the 'title' property

```typescript
const queryResult = await db.query((doc: TodoItem) => { return doc.title}, {includeDocs: false});
```

The result is

```json
Query Result

{
  "rows": [
    {
      "key": "My first todo item",
      "id": "unique-id-1",
      "value": null
    },
    {
      "key": "My fourth todo item",
      "id": "unique-id-4",
      "value": null
    },
    {
      "key": "My second todo item",
      "id": "unique-id-2",
      "value": null
    }
  ]
}
```

- Look at that! The return value of the map function is the value of the `"key": ` in the returned result. More specifically, the return statement was `return doc.title` and so the value of the 'title' property of each doc is the value of the `"key"` property.
- So far, this has behaved exactly like a call to `db.query('title');`

But what if the map function returned an array?

```typescript
const queryResult = await db.query((doc: TodoItem) => { return [doc.title, doc.completed, doc.createdAt]}, {includeDocs: false});
```

The result is

```json
Query Result

{
  "rows": [
    {
      "key": [
        "My first todo item",
        false,
        "2025-05-28T00:47:47.939Z"
      ],
      "id": "unique-id-1",
      "value": null
    },
    {
      "key": [
        "My fourth todo item",
        true,
        "2025-05-28T00:47:47.939Z"
      ],
      "id": "unique-id-4",
      "value": null
    },
    {
      "key": [
        "My second todo item",
        true,
        "2025-05-28T00:47:47.939Z"
      ],
      "id": "unique-id-2",
      "value": null
    }
  ]
}
```

- Aha! The return array value of the map function, from the statement `return [doc.title, doc.completed, doc.createdAt]` is now the value of the `"key": ` property in the returned result.
- This is called "Compound Keys" in the [official documentation](https://use-fireproof.com/docs/guides/custom_queries#compound-keys)
- This does indeed create indexes. Each time you define a map function or specify a field name to query, Fireproof creates an index. These indexes are stored alongside your data in the database and are updated whenever documents change. Fireproof uses a data structure similar to B-trees (specifically, Prolly Trees) for efficient querying and updates.
- The map function must return a value that can be encoded as a simple key. Valid return types include:
  - Simple values: strings, numbers, booleans
  - Arrays of simple values (for compound keys)
  - `undefined` or `null` (document will be excluded from the index)
  - If the map function returns an object like `{id: doc._id, title: doc.title}`, it will throw an error because complex objects cannot be encoded as keys.

Notice that in all the query results seen so far, here has been a property named `"value: null"` (or, in some cases `"row": null`). Let's demystify that now. TODO: Clean up this statement after a better understanding of when value: is returned and when row: is returned. 

### Queries that utilize emit()

So far, we have only used map functions that take a single argument, which is `doc: DocWithId<T>`. However, map functions can take a second argument as seen in the signature of the map function:  `export type MapFn<T extends DocTypes> = (doc: DocWithId<T>, emit: EmitFn) => DocFragment | unknown;`

This second argument is a function of type `EmitFn` which has the signature `type EmitFn = (k: IndexKeyType, v?: DocFragment) => void;` i.e. it is a function that takes two arguments with the second one being optional. Let's explore all this with examples that will make matters more clear.

```typescript
const queryResult = await db.query((doc: TodoItem, emit) => { emit (doc.title, doc.tags) }, {includeDocs: false});
```

The result is

```json
Query Result

{
  "rows": [
    {
      "key": "My first todo item",
      "id": "unique-id-1",
      "value": [
        "example",
        "first"
      ]
    },
    {
      "key": "My fourth todo item",
      "id": "unique-id-4",
      "value": [
        "example",
        "fourth"
      ]
    },
    {
      "key": "My second todo item",
      "id": "unique-id-2",
      "value": [
        "example",
        "second"
      ]
    }
  ]
}
```

- Ahhh.. so the first argument to emit() i.e. `doc.title` is now the value of  `"key: ` and the second argument to emit() i.e. `doc.tags` is the value of `"value": `. 
- Note that the second argument does not need to be the string 'emit'. That following function calls are identical
  - `const queryResult = await db.query((doc: TodoItem, emit) => { emit (doc.title, doc.tags) }, {includeDocs: false});` 
  - `const queryResult = await db.query((doc: TodoItem, foobar) => { foobar (doc.title, doc.tags) }, {includeDocs: false});` 
- TODO: I don't really understand how this works. The second argument is clearly a built-in function (I have certainly not defined it in my own code). This built-in function, as per its signature, returns a void. Which means it is having some sort of side-effect.. because it affects the result of `db.query()`

We can make the second argument to emit be an arbitrary object and this will then get assigned to `"value": ` in the query result.

```typescript
const queryResult = await db.query((doc: TodoItem, emit) => { emit (doc.title, {id: doc._id, completed: doc.completed, foo: 'bar'})}, {includeDocs: false});
```

The result is

```json
Query Result

{
  "rows": [
    {
      "key": "My first todo item",
      "id": "unique-id-1",
      "value": {
        "id": "unique-id-1",
        "completed": false,
        "foo": "bar"
      }
    },
    {
      "key": "My fourth todo item",
      "id": "unique-id-4",
      "value": {
        "id": "unique-id-4",
        "completed": true,
        "foo": "bar"
      }
    },
    {
      "key": "My second todo item",
      "id": "unique-id-2",
      "value": {
        "id": "unique-id-2",
        "completed": true,
        "foo": "bar"
      }
    }
  ]
}
```

- As before, the first argument to emit gets assigned to the value of `"key": ` and the second argument gets assigned to the value of `"value": `
- Just as a reminder, if the function call had `{includeDocs: true}` there would have been a `"doc": ` property in the result whose value would the entire content of the document.

Can the emit function be called more than once in the body of the map function? Let's try

```typescript
const queryResult = await db.query((doc: TodoItem, emit) => { emit (doc.title, {id: doc._id, completed: doc.completed, foo: 'bar'}); emit (doc.createdAt.toString(), doc.tags)}, {includeDocs: false});
```

- Why did we need the `.toString()` in the first argument of the second call to emit? Because the first argument to emit needs to be of type `string | number | boolean`  whereas `doc.createdAt` is of type `Date`, so we need to convert it to a string.
  - Actually, the type of the first argument is `IndexKeyType` which has the following definition
  - `export type KeyLiteral = string | number | boolean;`
  - `export type IndexKeyType = KeyLiteral | KeyLiteral[];`
  - TODO: Confirm the above
  - Exercise to the reader: What happens if the first argument to emit() is an array?

The result of the above call with multiple emit()s is

```json
Query Result

{
  "rows": [
    {
      "key": "2025-05-28T01:39:49.526Z",
      "id": "unique-id-1",
      "value": [
        "example",
        "first"
      ]
    },
    {
      "key": "2025-05-28T01:39:49.526Z",
      "id": "unique-id-2",
      "value": [
        "example",
        "second"
      ]
    },
    {
      "key": "2025-05-28T01:39:49.526Z",
      "id": "unique-id-4",
      "value": [
        "example",
        "fourth"
      ]
    },
    {
      "key": "My first todo item",
      "id": "unique-id-1",
      "value": {
        "id": "unique-id-1",
        "foo": "bar",
        "completed": false
      }
    },
    {
      "key": "My fourth todo item",
      "id": "unique-id-4",
      "value": {
        "id": "unique-id-4",
        "foo": "bar",
        "completed": true
      }
    },
    {
      "key": "My second todo item",
      "id": "unique-id-2",
      "value": {
        "id": "unique-id-2",
        "foo": "bar",
        "completed": true
      }
    }
  ]
}
```

- So it is possible to make multiple calls to emit in the map function. Each call results in its own object in the returned query result

In all the queries above where we used `emit()`, the map function did not have any explicit return value. What if it did? Let's try

```typescript
const queryResult = await db.query((doc: TodoItem, emit) => { emit(doc.createdAt.toString(), doc.tags) ; return [doc.title, doc.completed]}, {includeDocs: false});
```

The result is

```json
Query Result

{
  "rows": [
    {
      "key": "2025-05-28T01:53:30.338Z",
      "id": "unique-id-1",
      "value": [
        "example",
        "first"
      ]
    },
    {
      "key": "2025-05-28T01:53:30.338Z",
      "id": "unique-id-2",
      "value": [
        "example",
        "second"
      ]
    },
    {
      "key": "2025-05-28T01:53:30.338Z",
      "id": "unique-id-4",
      "value": [
        "example",
        "fourth"
      ]
    }
  ]
}
```

- So it seems like the statement `return [doc.title, doc.completed]` had no impact at all. Only the `emit(doc.createdAt.toString(), doc.tags)` has appeared in the query result.
  - This confirms that when `emit()` is called within a map function, it takes precedence over the function's return value. The `emit()` function is designed to allow multiple index entries per document (by calling it multiple times), while the return value can only create a single index entry.
- Remember that if the emit() call was not present and only  `return [doc.title, doc.completed]`  was present, then the query result would have had the value of  `"key":  ` as the [doc.title, doc.completed] array and the `"value":  ` property would have been null. We saw this exact example at the end of the previous section ('Querying with a Map Function')

### Summary of db.query()

Phew! That was a lot to go through. Let's summarize what we have learned

- `db.query()` can be called with two arguments
  - The first argument is either a string literal or a map function
    - If it is a string literal, any document having that as a property is part of the result
    - If it is a map function
      - It can have either a single `doc: DocWithId<t>` argument in which case the return value corresponds to the value of the `"key"; ` property in the query result
      - Or it can have an additional `emit` argument which is a function that takes two arguments.
        - The first argument to emit corresponds to the  `"key": ` property in the query result
        - The second argument to emit, which can be any arbitrary object, corresponds to the `"value": ` property in the query result
  - The second (optional) argument is a query options object with a specific set of key: value pairs, each of which impacts the query result in a certain way

The `range` option in the query options object is a powerful feature that allows you to specify a range of keys to search within. For example, you could query all documents with dates falling between a start and end date. Here's an example:

```typescript
const queryResult = await db.query('date', {
  range: [startDate, endDate],
  includeDocs: true
});
```

When using compound keys with an array return from your map function, the range can be particularly powerful. For example, if you have a map function that returns `[doc.listId, doc.date]`, you can query for all items in a specific list within a date range:

```typescript
const queryResult = await db.query(
  (doc) => [doc.listId, doc.date],
  {
    range: [
      [listId, startDate],
      [listId, endDate]
    ]
  }
);
```

### Why is db.query() designed this way?

The flexible design of Fireproof's query system is inspired by proven patterns from databases like CouchDB, but optimized for the browser environment. This design offers several important benefits:

1. **Data Normalization**: The map function approach allows you to normalize and transform document data during querying. This means you can handle different document versions or formats in a consistent way.

2. **Flexible Indexing**: By returning different values from the map function, you can create custom indexes on any field or combination of fields in your documents.

3. **Efficient Querying**: Fireproof creates persistent indexes based on your query definitions, making subsequent queries very fast.

4. **Schema Flexibility**: Since there's no schema enforcement at the database level, you can evolve your data model over time while maintaining backward compatibility through map functions.

5. **Complex Data Relationships**: The emit function allows for creating complex views of your data that go beyond simple key-value lookups.

This approach makes Fireproof particularly well-suited for applications with evolving data models or those that need to work with data from multiple sources or versions.

## Subscribing to changes

One of Fireproof's most powerful features is its ability to notify your application when data changes. This makes building reactive applications much easier as your UI can automatically update when the underlying data changes.

### Using the onChange handler

You can subscribe to all changes in the database using the `db.onChange()` method:

```typescript
const unsubscribe = db.onChange((database, changes) => {
  console.log('Database changes:', changes);
  // Update your UI or perform other actions based on changes
});
```

The callback function receives two arguments:
- `database`: A reference to the database instance
- `changes`: An object containing information about the changes that occurred

When you're done listening to changes, you can unsubscribe by calling the function returned by `onChange()`:

```typescript
// Stop listening to changes
unsubscribe();
```

### Using onUpdate for query results

For more targeted change detection, you can listen for updates to specific query results using the `db.onUpdate()` method:

```typescript
const queryResult = await db.query('completed', {key: false});

const unsubscribeQuery = db.onUpdate(queryResult, (newResult) => {
  console.log('Query results updated:', newResult);
  // Update your UI with the new results
});

// Later, when you're done listening
unsubscribeQuery();
```

### Example: Auto-updating UI

Here's a practical example of how you might use these subscription mechanisms in a real application:

```typescript
// Initial load of incomplete todos
let incompleteTodos = await db.query('completed', {key: false});
renderTodoList(incompleteTodos.rows);

// Subscribe to updates to the query
db.onUpdate(incompleteTodos, (newResults) => {
  incompleteTodos = newResults;
  renderTodoList(incompleteTodos.rows);
});

// Simulate a new todo being added
async function addTodo(text: string) {
  await db.put({
    type: 'TodoItem',
    text,
    completed: false,
    createdAt: new Date(),
    updatedAt: null,
    tags: []
  });
  // No need to manually update the UI or refetch data
  // The onUpdate handler will be called automatically
}
```

This reactive pattern simplifies application architecture by reducing the need for manual state management and data fetching.

## Advanced Features

Fireproof includes several advanced features that extend its capabilities beyond basic document storage and querying. This section provides a brief overview of these features.

### Tracking Changes

Fireproof keeps a log of all changes to the database using a Merkle CRDT (Conflict-free Replicated Data Type) structure. You can access this log using the `db.changes()` method:

```typescript
const changes = await db.changes();
console.log('All changes:', changes);

// Get changes since a specific clock
const newChanges = await db.changes(previousClock);
```

This is particularly useful for synchronizing with external systems or implementing custom replication strategies.

### External Indexers

For specialized search needs, Fireproof can integrate with external indexers. For example, you can implement full-text search using libraries like Flexsearch:

```typescript
import { flexsearch } from 'flexsearch';

// Create a full-text search index
const index = new flexsearch.Index();
let clock = null;

// Update the index with changes from Fireproof
async function updateIndex() {
  const changes = await db.changes(clock);
  clock = changes.clock;
  
  for (const row of changes.rows) {
    const { key, value } = row;
    // Add document to the search index
    index.add(key, value.text);
  }
}

// Search the index
function search(query) {
  return index.search(query);
}
```

### Syncing Multiple Devices

Fireproof supports syncing data across multiple devices or browsers. The sync process uses a cryptographically secure mechanism to ensure data integrity.

```typescript
import { connect } from '@fireproof/connect';

// Connect to a sync provider (e.g., S3, IPFS)
const connector = connect(db, {
  provider: 's3',
  region: 'us-west-2',
  bucket: 'my-app-data',
  // Authentication credentials as needed
});

// Start syncing
connector.connect();

// Later, disconnect
connector.disconnect();
```

Fireproof's syncing mechanism works offline-first, meaning changes are stored locally and synchronized when a connection becomes available.

### File Attachments

Fireproof supports attaching files to documents using the `_files` property:

```typescript
// Add a file to a document
const fileData = await fetch('image.jpg').then(r => r.arrayBuffer());
const docWithFile = {
  _id: 'doc-with-attachment',
  title: 'Document with an attachment',
  _files: {
    'image.jpg': new Uint8Array(fileData)
  }
};

await db.put(docWithFile);

// Retrieve a document with files
const doc = await db.get('doc-with-attachment');
const imageData = doc._files['image.jpg'];
```

### Encryption

By default, Fireproof encrypts all data stored in the database using AES-GCM encryption. This encryption happens automatically and transparently, but you can customize it or disable it if needed:

```typescript
// Create a database with encryption disabled (for public data)
const publicDb = fireproof('public-data', { public: true });

// Create a database with a custom encryption key
const secureDb = fireproof('secure-data', { 
  keyManager: myCustomKeyManager 
});
```

These advanced features make Fireproof suitable for a wide range of applications, from simple todo lists to complex collaborative tools with offline support.

## Summary

In this tutorial, we've explored the core features of Fireproof, a lightweight embedded document database designed for browser applications. We've covered:

1. **Installation and basic setup**: How to install Fireproof and create a database
2. **Document operations**: Adding, retrieving, updating, and deleting documents
3. **Querying data**: Using simple field queries, map functions, and the emit pattern
4. **Subscribing to changes**: Reactive programming with onChange and onUpdate
5. **Advanced features**: Change tracking, external indexers, syncing, and encryption

Fireproof's query system is inspired by CouchDB but optimized for browser environments. Documents are sorted by key values in ascending order by default. When using map or emit functions, the results are indeed sorted by key, similar to CouchDB.

With its combination of local-first operation, powerful querying capabilities, and built-in sync, Fireproof provides a solid foundation for building responsive, offline-capable web applications. The database's immutable architecture ensures data integrity while its flexible query system accommodates evolving data models.
