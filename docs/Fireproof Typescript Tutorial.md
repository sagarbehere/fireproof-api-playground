This newbie-friendly tutorial explains the fireproof API and how to use it in a Typescript project. It is accompanied by code that you can use as the start for your own learning and experimentation. As you go through this tutorial, simply uncomment relevant parts of the code and observe the results.

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

Connecting to the database is the first API call you should make and a prerequisite to using the rest of the API. You may see the word 'ledger' instead of 'database' in various places. It is the same thing. TODO: Confirm this. Is it really the same thing? Or just closely related? Connecting to the database is simple as

```typescript
const db : Database = fireproof('my-database');
```

The function signature is: `fireproof(name: string, opts?: ConfigOpts): Database`

- The function definition is in the `src/ledger.ts` file in the source tree. The interface definition of types `Database` is in `src/types.ts`.
- The `my-database` string argument in the above example can be any arbitrary string of your choice and is the name of the database that gets created
  - In case you ever need to retrieve the name string, it is available in `db.name`
- There is an optional configuration object of type `ConfigOpts` that can be passed as an argument.
  - `ConfigOpts` is defined in `src/types.ts` and has a whole bunch of possible parameters
  - One possible parameter mentioned in the official documentation is `public?: boolean` , which leads to a statement like  `const db = fireproof('my-database', { public: true });`
    - The official documentation notes that passing `{public: true }` bypasses encryption and that "..this is useful for creating a database that you want to share with other users."
    - On discord, it was noted that this option actually "uses a hardcoded key so that everyone can decode". So it seems that the data in the database is not actually stored unencrypted aka plain text. TODO: Clarify this. The doc section on [Configuring encryption](https://use-fireproof.com/docs/database-api/encryption#configuring-encryption) explicitly says *"This functionality allows you to create unencrypted ledger files for publishing."*
  - TODO: Couldn't really find a place in the docs that describes the rest of the parameters. Some of them sound intriguing (`autoCompact?: number`?) Which other options are worth mentioning here?
- TODO: Which other APIs are worth mentioning here? I see `close()` and `destroy()` in the source code, but they are not a part of the `Database` interface definition. Perhaps they are for internal use only, and not by users? Is it recommended to call them when cleanly shutting down the app? What about the `onClosed(fn: () => void): void;` ? That looks interesting. Is it for users? What does it do?
- TODO: The [Creating a database](https://use-fireproof.com/docs/reference/core-api/database#creating-a-database) section in the docs says, *"The database name is optional, and if you don't provide one, the database will operate in-memory only. This is useful for testing, or for creating a database that you don't want to persist."* However, this does not seem to be accurate, based on the function signature in the code and the fact that the IDE's Typescript support shows an error if the database name is omitted.

## Adding and retrieving data

Data is added/retrieved to/from the database in the form of "documents". A document is basically a Javascript/JSON object i.e. something like `{ key1: value1, key2: value2 }` where the values can themselves be objects, thus allowing arbitrarily nested data to be added to the database.

### Adding data

The method for adding a document to the database is `db.put()` and you can use it as follows:

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

Now here is an interesting bit. The database is immutable, so the document is not _actually_ deleted. What happens instead is that fireproof marks the document as deleted by adding a `_deleted: true` property:value pair to the document. TODO: Confirm this.

When a document is marked as deleted, it will not be retrieved by a call to `db.get()`. In this case, `db.get()` will throw an error containing the message "Not found: the-doc-id". HOWEVER, be careful! Some other methods of retrieving data _will_ return a mangled form of the deleted document (see the section on `db.allDocs()` below).

NOTE: If a document is deleted by a call to `db.del()` and you later `db.put()` it back into the database (see next section on updating previously added documents) after setting `_delete: false`, that document gets un-deleted. This is an empirical observation at the time of this writing and it is probably not wise to rely on it. TODO: Should a user rely on this? Or might it possibly break in the future?

The fact that the database is immutable means that its content can never be deleted. The database keeps growing. This means the size of your browser's IndexedDB, which is the in-browser persistent store for the database, will keep growing monotonically. The underlying data model makes it possible to leave the tail of the database behind in some cloud archive, but that functionality has not yet been written. In practice, a database slows down at about ˜100,000 records. It is expected that in the longer run, this limit would be more like a working set size and cold data would be stored only in the cloud.

TODO: Is the above paragraph accurate? Also, would it be possible for an app to create a new database, copy over all non-deleted items from the old database, and then entirely delete the old database? If yes, would it be possible to add an API call that does this in a single function call?

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

  - The sample code deletes the doc with `id: 'unique-id-3` but it still shows up in the return value of `db.allDocs()` in a slightly mangled form. Only the `_id` and `_deleted: true` are present in the `value` property.
  - TODO: Clarify the rationale for this. In my opinion, this "fetaure" reduces the value of db.allDocs() . Are there any usecases I have overlooked where this behaviour is useful?

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

Having looked at `db.get()` and `db.allDocs()`, we now look at the most flexible and sophisticated way of retrieving data from the database. This is the `db.query()` method.

- `db.query()` accepts two arguements. 
  - The first argument is tells fireproof about the document property name(s) i.e. keys of interest. Fireproof will return from the database all those documents that contain the property name(s) in the first argument. TODO: Confirm that this understanding is accurate
    - The first argument can either be a simple string that is the property/key name OR 
    - it can be a so-called "Map function" that returns one or more property names. 
  - The second (optional) argument is a so-called query options object. It is an object which can contain some specific key-value pairs, each of which has a particular meaning and effect on how the documents specified by the first argument are further filtered or organized.

Since the possible values for the first and second arguments and their combinations and effects are many, and can be overwhelming at first glance, we will start with the simplest usage of `db.query()` and progressively build up towards complex invocations.

### Basic queries

The simplest way to use `db.query()` is to pass it a single string argument which is the name of a property/key in the type of documents you want to retrieve. Fireproof will then return all documents that have this key. So the line of code below will return all documents in the database that have a property/key named 'completed' (which should be _all_ of the 4 documents we have `db.put()` into the database.)

```typescript
const queryResult = await db.query('completed');
```

The value of `queryResult` is as follows, for the sample code accompanying this tutorial:

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
  - `value` always seems to be `null`. TODO: Understand what this is for and when it will be non-null.
  - `doc` is an optional property and, if present, is the actual document that matched the query criteria. This will be of the type `DocWithId<t>` that we have seen before.
    - NOTE: The definition of the `IndexRow` type in `src/types.ts` indicates that `doc` may be optional. TODO: Understand when it may not be present. In all my experimentation so far, it has always been present.
  - If the property name passed to `db.query()` does not exist in any doc in the database, the resulting `rows` object will be an empty array.
- The doc with `_id: unique-id-3` which we had deleted is _not_ present in the results. This behavior is consistent with the behavior of `db.get()` but is different from the behavior of `db.allDocs()` which had returned a mangled form of the deleted document in its results.
- The results seem to be in no particular order

Now, let's run the same `db.query('completed')` call but include the optional query options argument. We will use `{key: true}` as the query option. The return value should then include only those documents which i) have a property named 'completed' and ii) That property has value `true`.

```typescript
const queryResult = await db.query('completed', {key: true});
```

The output is

```json
Query Result

{
  "rows": [
    {
      "key": true,
      "id": "unique-id-2",
      "row": null,
      "doc": {
        "_id": "unique-id-2",
        "tags": [
          "example",
          "second"
        ],
        "type": "TodoItem",
        "title": "My second todo item",
        "completed": true,
        "createdAt": "2025-05-26T21:48:46.749Z",
        "updatedAt": null
      }
    },
    {
      "key": true,
      "id": "unique-id-4",
      "row": null,
      "doc": {
        "_id": "unique-id-4",
        "tags": [
          "example",
          "fourth"
        ],
        "type": "TodoItem",
        "title": "My fourth todo item",
        "completed": true,
        "createdAt": "2025-05-26T21:48:46.749Z",
        "updatedAt": null
      }
    }
  ]
}
```

That seems to be working. The output only contains non-deleted documents with `completed: true`. 

NOTE: The content of the returned value has changed!?! Instead of having a property named `value: null` as in the previous result, this result has the property `row: null`. TODO: Why did `value: null` turn into `row: null` ?

Just for fun, let's try setting the filter option to `false`. This should return only one document, with `_id: unique-id-1` which has `completed: false`.

```typescript
const queryResult = await db.query('completed', {key: false});
```

And the output is

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
        "createdAt": "2025-05-26T21:51:18.077Z",
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
        "createdAt": "2025-05-26T21:51:18.077Z",
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
        "createdAt": "2025-05-26T21:51:18.077Z",
        "updatedAt": null
      }
    }
  ]
}
```

- TODO: ??? WHY IS THE RESULT SHOWING DOCS WITH `completed: true` ???
- TODO: The `value: null` property is back!? It was replaced with `row: null` when we called `db.query` with `{key: true}` ??
- TODO: Why does the call `const queryResult = await db.query('title', {prefix: 'My'});` return no results? Shouldn't it return all documents where the value of `title` key starts with `My` i.e. all the documents in the current database, since all their titles start with "My " ? It seems I'm misunderstanding how the "prefix" works in the query options object?
- TODO: The official docs say that the query options object can have `{ limit: 10, startkey: lastKey }` however, they type declaration of `QueryOpts` in `src/types.ts` does not mention any `startkey` property and the TypeScript complier also complains when it is included in the query options object. It seems that `startkey` is not a valid member of the query options object. Not sure how it works and what the `lastKey` mentioned in the documentation is. Note that `limit: Num` property seems to have the intended effect of only showing Num results (but not clear what order those Num results are in, if no `descending` option is specified. Might be whatever the default value of `descending` is..)
- If you pass `includeDocs: false` in the query options, the returned results objects will not have the `doc`  property. Only the `key`, `id`,  and the `row: null` or `value: null` properties will be present.
- TODO: What does the `emit()` function which seems like it **should** be passed as the second argument to the `MapFn()` function do? Where is it defined? The source seems to indicate that the `emit` function returns a `void`. So how does it have any impact? The code shown in the official 'Querying data' guide under Section "Filtering and Transformation" does _not_ work, because the Typescript compiler correctly complains that the `emit` function is not defined.
  - `type EmitFn = (k: IndexKeyType, v?: DocFragment) => void;`
  - `export type MapFn<T extends DocTypes> = (doc: DocWithId<T>, emit: EmitFn) => DocFragment | unknown;`
  - How does this work? It seems that `emit: EmitFn` is not an optional argument. But the official docs don't show any examples of emit being passed as an argument to MapFn. The docs only show MapFn as an arrow function that takes a single input which is `doc: DocWithId<t>`.
  - Even if I define `function myEmitFn (k: IndexKeyType, v?: DocFragment): void {//code that does something with k and v}`, what impact will it have when passed as argument to a MapFn, since it returns a `void` (unless it has some side-effects?)? How does the code in the official 'Querying data' guide in the section 'Map Function Queries' work? What does `emit(doc.listId, doc)` do? Where is the code of this emit() function?
- TODO: What value should the MapFn return? How is that return value supposed to be used? It _seems_ like it takes one argument which is each doc in the database, and then it should(?) return a key or an array of keys from the doc? 
  - It seems that `const queryResult = await db.query((doc: TodoItem) => { return doc.title});` is the same as `const queryResult = await db.query('title');`. Is this correct?
  - `const queryResult = await db.query((doc: TodoItem) => { return [doc.title, doc.completed]});` returns results where e.g. `"key": ["My first todo item", false]`. So it does seem that the return value of MapFn (at least when it takes just a single `doc: DocWithId<t>` argument) should be the "key" whose values should be filtered by the query options object? Is this correct?

Still need to play with range: and keys[] in the query options object. But at this point I feel so lost that it makes little sense to proceed without answers to the above questions.

## Subscribing to changes

To be written

## Advanced stuff

Querying changes, external indexers. Will probably not include in this tutorial

