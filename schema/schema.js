const graphql = require("graphql");
const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLInt,
  GraphQLSchema,
  GraphQLList,
  GraphQLNonNull,
} = graphql;
const { v4 } = require('uuid');

const uuid = new GraphQLObjectType({
  name: "uuid",
  fields: () => ({
    v4: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: () => v4(),
    },
  }),
});

const RootQuery = new GraphQLObjectType({
  name: "RootQuery",
  fields: {
    uuid: {
      type: uuid,
      resolve: () => ({}),
    },
  },
});

const schema = new GraphQLSchema({
  query: RootQuery,
});

module.exports = { schema };
