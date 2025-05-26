# Fireproof API Playground

This repository helps you to play with the Fireproof database API using Typescript. It provides a project with some code files via which you can easily play with `put()`, `get()`, `del()`, `query()` etc. API calls and observe their return values. I made this project in order to learn Fireproof. My learnings are consolidated in a [newbie-friendly tutorial](docs/Fireproof%20Typescript%20Tutorial.md) in the `docs/` folder.

The suggested way to use this project is to clone the repo and experiment with the API calls as you follow the tutorial (primarily by uncommenting relevant lines of code and observing the results in the browser).

The project consists of a single `index.html` file which you can load in your browser after executing the `npm run dev` command and going to the URL mentioned in the command's output. It is typically something like http://localhost:5173 although the port number (the number after the :) may be different in your case.

Keep the browser window open in one half of your screen. In the other half, open your code editor and uncomment/modify/add the existing API calls in the file `main.ts`. Then pass the result of the API call to the `showResponse()` function and that result will appear in the browser. For example, you will see the following code in `main.ts`

```
const response: DocResponse = await db.put(myTodoItem1);
showResponse('db.put() returned the following:', response);
```

What is happening here is that the result of the `db.put()` function is being shown in the browser, preceded by the line, "db.put() returned the following:". 

To make experimentation easy, the code loads 4 todo item "documents" into the database. Each todo item has the structure shown in the code snippet below:

```
interface TodoItem {
  _id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date | null;
  tags: string[];
};
```

With the 4 todo items already present in the database, it is easy to play with put(), get(), del(), query() and other API calls.

Now go ahead and play with any API call you like and feed its result to `showResponse()`. There are plenty of examples in `main.ts` to get you started.