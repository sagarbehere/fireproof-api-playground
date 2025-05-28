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

Connecting to the database is the first API call you should make and a prerequisite to using the rest of the API. You may see the word 'ledger' instead of 'database' in various places. It is the same thing. TODO: Confirm this. Is it really the same thing? Or just closely related? Connecting to the database is as simple as

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
    - On discord, it was noted that this option actually "uses a hardcoded key so that everyone can decode". So it seems that the data in the database is not actually stored unencrypted aka plain text. TODO: Clarify this. The doc section on [Configuring encryption](https://use-fireproof.com/docs/database-api/encryption#configuring-encryption) explicitly says *"This functionality allows you to create unencrypted ledger files for publishing."*
  - TODO: Couldn't really find a place in the docs that describes the rest of the parameters. Some of them sound intriguing (`autoCompact?: number`?) Which other options are worth mentioning here?
- TODO: Which other APIs are worth mentioning here? I see `close()` and `destroy()` in the source code, but they are not a part of the `Database` interface definition. Perhaps they are for internal use only, and not by users? Is it recommended to call them when cleanly shutting down the app? What about the `onClosed(fn: () => void): void;` ? That looks interesting. Is it for users? What does it do?
- TODO: The [Creating a database](https://use-fireproof.com/docs/reference/core-api/database#creating-a-database) section in the docs says, *"The database name is optional, and if you don't provide one, the database will operate in-memory only. This is useful for testing, or for creating a database that you don't want to persist."* However, this does not seem to be accurate, based on the function signature in the code and the fact that the IDE's Typescript support shows an error if the database name is omitted.

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
  - In a practical sense, you can treat the returned value of type `DocWithId<T>` as being the same as type `T` that you previously added into the database. TODO: Confirm this.

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
  - TODO: Clarify the rationale for this. In my opinion, this "feature" reduces the value of db.allDocs() . Are there any use cases I have overlooked where this behaviour is useful?

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

  - We will look at query options in the next section. However, for now, note that passing an object like `{key: title}` or `{key: 'unique-id-1}` seems to have no impact. The official documentation does not mention query options for allDocs(), so it is possible that this is not yet supported. TODO: Confirm this.

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
- It is not obvious, but the results are sorted by the value of the `"key":`. TODO: Confirm this.. that the results are indeed sorted by default by the key value.

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

- NOTE: The content of the returned value has changed!?! Instead of having a property named `value: null` as in the previous result, this result has the property `row: null`. TODO: Why did `value: null` turn into `row: null` ?

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

- TODO: ??? Why is the result showing docs with `completed: true` ???
- TODO: The `value: null` property is back!? It was replaced with `row: null` when we called `db.query` with `{key: true}` ??
- TODO: Just for fun, I tried `keys: [false]` in the options object, instead of `key: false`.. et voila! Then only the document with `completed: false` is returned, which is the expected behavior. Why is there a difference between `key: false` and `keys: [false]` ?

Now, let's run the following query which should return docs whose `completed` property has a value of either `true` or `false`. We do this by passing a `keys: ` property in the query options object with a value that is an array. The array's contents are the possible exact matches we are looking for. TODO: Confirm that this understanding of `keys: ` is correct.

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

- TODO: The `value: null` property has disappeared again and is replaced with `row: null` ?!
  - TODO: Not sure what is going on here. Any time the options object contains `{key: }`  or `{keys:}` the return value seems to have `row: ` instead of `value: ` ? Nah, that does not make sense, since the return value of `key: false` above has `value: `. Real head-scratcher this. Need to understand the rule for when value: or row: appears in the result.
- TODO: Hey look, the results don't actually seem to be sorted by key value here? Actually, it is observed that the results order above is unaffected **regardless** of whether `descending: ` is `true` or `false` in the options object. Why? How is the ordering happening?

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

- TODO: HUH?? Why are we getting two results when `limit: 1` is specified? Also, if I set `limit: 2`, then three results are sent back. However, the `limit: ` seems to work correctly if the query has `keys: [true]` or `key: true`. So the number of result is off-by-one only in the case where `keys: [true, false]` ?!
- TODO: Unclear what order the results are presented in, and selected from, when there is no explicit `descending: ` option and when `limit: ` is present.

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

- TODO: Uhh.. that clearly did not work. Why does the call `const queryResult = await db.query('title', {prefix: 'My'});` return no results? Shouldn't it return all documents where the value of `title` key starts with `My` i.e. all the documents in the current database, since all their titles start with "My " ? It seems I'm misunderstanding how the "prefix" works in the query options object?

- TODO: The official docs section on [Pagination](https://use-fireproof.com/docs/guides/custom_queries#pagination) mentions that the query options object can have `{ limit: 10, startkey: lastKey }` however, the type declaration of `QueryOpts` in `src/types.ts` does not mention any `startkey` property and the TypeScript complier also complains when it is included in the query options object. It seems that `startkey` is not a valid member of the query options object. Not sure how it works and what the `lastKey` mentioned in the documentation is. Note that `limit: Num` property seems to have the intended effect of only showing Num results (but not clear what order those Num results are in, if no `descending` option is specified. Might be whatever the default value of `descending` is..)

Alright! So far, we have only experimented with the case where the first argument to `db.query()` is a simple string value. Let's switch to the case where the first argument is a function.

### Querying with a Map Function

Instead of a simple string value, the first argument of `db.query()` can also be a so-called "map function".

The map function has type signature `export type MapFn<T extends DocTypes> = (doc: DocWithId<T>, emit: EmitFn) => DocFragment | unknown;`

- The map function has two arguments. 
- The first argument is a `doc: DocWithId<T>`. You should be familiar with this type by now. Basically, the map function is called on every document in the database and the document is passed as the first argument.
- The second argument is a so-called emit() function. Let's ignore it for now. We'll get back to it a bit later in this tutorial.
  - TODO: Understand why the map function still works if no second argument is provided. It does not seem to be an optional argument, based on the function signature, yet it still works without the second argument.

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
- TODO: This looks like a way to create indexes. Confirm if that is indeed the intent here. Where are the indexes created and how are they stored? The couchbase docs mention similar syntax and there they claim that this leads to the creation of B-tree indexes that are used when queries are made. Not clear if that is the case here.
- If the map function tries to return something other that a document property or an array of document properties, Fireproof will throw an error. 
  - For example, if the map function is: `(doc: TodoItem) => {return {id: doc._id, title: doc.title}}` then the browser console will show the error: Uncaught Error: can only encode arrays
  - TODO: Confirm the above. What other returns are acceptable from the map function?

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
  - TODO: Confirm that the presene of emit() overrides the return value of the map function
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

PENDING: Still need to play with range: in the query options object and see what it does.

PENDING: This section currently only describes _what_ happens when `db.query()` is called in different ways. Write something about _why_ it is designed this way. Basically that this flexible structure enables very powerful and arbitrary data manipulation and normalization while querying.

## Subscribing to changes

To be written

## Advanced stuff

Querying changes, external indexers, syncing multiple devices. Will probably not include in this tutorial

## Open questions I'm still working through

1. Are documents sorted by _id by default? If not, is there any default sort order when getting docs via query() or allDocs()?
5. Is the result of the map function (or emit function) sorted by key, similarly to couchdb?
