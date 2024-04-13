const { graphql } = require("graphql");
const express = require("express");
const { createHandler } = require("graphql-http/lib/use/express");
const { ruruHTML } = require("ruru/server");
const { schema } = require("./schema/schema")

// The root provides a resolver function for each API endpoint
const root = {
  hello: () => "Hello world!",
};

// Create a express instance serving all methods on `/graphql`
// where the GraphQL over HTTP express request handler is
const app = express();

graphql({
  schema: schema,
  source: "{ hello }",
  rootValue: root,
  graphiql: true,
}).then(response => {
  console.log(response)
})

app.all(
  "/graphql",
  createHandler({
    schema: schema,
    rootValue: root,
  })
);

// Serve the GraphiQL IDE.
app.get("/", (_req, res) => {
  res.type("html");
  res.end(ruruHTML({ endpoint: "/graphql" }));
});

// Start the server at port
app.listen({ port: 4000 });
console.log("Listening to port 4000");
