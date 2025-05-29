import { fireproof } from 'use-fireproof';
import type { DocResponse, Database, DocWithId, IndexRow, IndexRows, AllDocsResponse } from 'use-fireproof';
import type { TodoItem } from './todo-item'; 
import { createDefaultTodoItem } from './todo-item';
import { showResponse } from './show-response';

// const db: Database = fireproof('my-database');
const db: Database = fireproof('my-database', {public: true});

// const myTodoItem1: TodoItem = {
//   type: 'TodoItem',
//   _id: '', // Ensure to provide a unique ID for the item
//   //_id: 'unique-id-1',
//   title: 'My first todo item',
//   completed: false,
//   createdAt: new Date('2025-05-25T21:47:55.651Z'),
//   updatedAt: null,
//   tags: ['example', 'first']
// };

const myTodoItem1: TodoItem = createDefaultTodoItem({
  _id: 'unique-id-1',
  title: 'My first todo item',
  completed: false,
  createdAt: new Date('2025-05-25T21:47:55.651Z'),
  updatedAt: null,
  tags: ['example', 'first']
});

const myTodoItem2: TodoItem = createDefaultTodoItem({
  _id: 'unique-id-2',
  title: 'My second todo item',
  completed: true,
  createdAt: new Date('2025-05-26T21:47:55.651Z'),
  updatedAt: null,
  tags: ['example', 'second']
});

const myTodoItem3: TodoItem = createDefaultTodoItem({
  _id: 'unique-id-3',
  title: 'My third todo item',
  completed: false,
  createdAt: new Date('2025-05-27T21:47:55.651Z'),
  updatedAt: null,
  tags: ['example', 'third']
});

const myTodoItem4: TodoItem = createDefaultTodoItem({
  _id: 'unique-id-4',
  title: 'My fourth todo item',
  completed: true,
  createdAt: new Date('2025-05-28T21:47:55.651Z'),
  updatedAt: null,
  tags: ['example', 'fourth']
});

// Testing db.put()
try {
  const response: DocResponse = await db.put(myTodoItem1);
  console.log('Inserted document with id:', response.id);
  // showResponse('db.put() returned the following:', response);
  await db.put(myTodoItem2);
  await db.put(myTodoItem3);
  await db.put(myTodoItem4);
} catch (error: Error | unknown) {
  if (error instanceof Error) {
    console.error('Error message:', error.message);
  } else {
    console.error('Error:', String(error));
  }
}

// Testing db.del()
// Let's delete the todo item with id 'unique-id-3'
try {
  const response: DocResponse = await db.del(myTodoItem3._id);
  console.log('Deleted document with id:', response.id);
  //showResponse('db.del() returned the following:', response);
} catch (error: Error | unknown) {
  if (error instanceof Error) {
    console.error('Error message:', error.message);
  } else {
    console.error('Error:', String(error));
  }
}

// Testing db.get()
try {
  const doc: DocWithId<TodoItem> = await db.get('unique-id-1');
  // showResponse('db.get() returned the following:', doc);

  // Let's try to db.get() a document that does not exist
  // There is no document with id 'unique-id-foo'
  // The line below should show error message in the browser console
  // "Error message: Not found: unique-id-foo"
  //await db.get('unique-id-foo'); 

  // Let's try to db.get() a deleted document
  // You should see an error message in the browser console
  // "Error message: Not found: unique-id-3"
  // const deletedDoc = await db.get(myTodoItem3._id);
} catch (error: Error | unknown) {
  if (error instanceof Error) {
    console.error('Error message:', error.message);
  } else {
    console.error('Error:', String(error));
  }
}

// Testing db.allDocs()
try {
  // allDocs() with no arguments
  // const allDocs: AllDocsResponse<TodoItem> = await db.allDocs();
  const allDocs: AllDocsResponse<TodoItem> = await db.allDocs({key: 'unique-id-1'});
  //const allDocs: AllDocsResponse<TodoItem> = await db.allDocs({key: 'completed'});
  showResponse('db.allDocs() returned the following:', allDocs);
} catch (error: Error | unknown) {
  if (error instanceof Error) {
    console.error('Error message:', error.message);
  } else {
    console.error('Error:', String(error));
  }
}

// Testing basic queries
// const queryResult = await db.query('completed');
// const queryResult = await db.query('completed', {includeDocs: false});
// const queryResult = await db.query('completed', {key: true, includeDocs: false});
// const queryResult = await db.query('completed', {key: false, includeDocs: false});
// const queryResult = await db.query('completed', {keys: [true, false], includeDocs: false});
// const queryResult = await db.query('completed', {keys: [false, true, false, true], includeDocs: false});
// const queryResult = await db.query('completed', {keys: [true, false], includeDocs: false, descending: false});
const queryResult = await db.query('completed', {keys: [true, false], includeDocs: false, limit: 1});
// const queryResult = await db.query('title', {prefix: 'My'});

// const queryResult = await db.query((doc: TodoItem) => { return doc.title}, {includeDocs: false});
// const queryResult = await db.query((doc: TodoItem) => { return [doc.title, doc.completed, doc.createdAt]}, {includeDocs: false});
// const queryResult = await db.query((doc: TodoItem, emit) => { emit (doc.title, doc.tags) }, {includeDocs: false});
// const queryResult = await db.query((doc: TodoItem, emit) => { emit (doc.title, {id: doc._id, completed: doc.completed, foo: 'bar'})}, {includeDocs: false});
// const queryResult = await db.query((doc: TodoItem, emit) => { emit (doc.title, {id: doc._id, completed: doc.completed, foo: 'bar'}); emit (doc.createdAt.toString(), doc.tags)}, {includeDocs: false});
// const queryResult = await db.query((doc: TodoItem, emit) => { emit(doc.createdAt.toString(), doc.tags) ; return [doc.title, doc.completed]}, {includeDocs: false});
// const queryResult = await db.query('createdAt', {range:['2025-05-26', '2025-05-29'], descending: true, includeDocs: false});
showResponse('Query Result', queryResult);

