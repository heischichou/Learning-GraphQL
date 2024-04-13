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
const axios = require("axios");
const { v4 } = require("uuid");

const uuid = new GraphQLObjectType({
  name: "uuid",
  fields: () => ({
    v4: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: () => `Query ID ${v4()}`,
    },
  }),
});

const CompanyType = new GraphQLObjectType({
  name: "Company",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLString) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    geo: { type: new GraphQLNonNull(GraphQLString) },
    employees: {
      type: new GraphQLNonNull(new GraphQLList(EmployeeType)),
      resolve: async (root, args) =>
        await axios
          .get(`http://localhost:3000/employees?companyId=${root.id}`)
          .then((res) => res.data),
    },
  }),
});

const EmployeeType = new GraphQLObjectType({
  name: "Employee",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLString) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    position: { type: new GraphQLNonNull(GraphQLString) },
    gender: {
      type: new GraphQLEnumType({
        name: "Gender",
        values: {
          Male: { value: "Male" },
          Female: { value: "Female" },
          Other: { value: "Other" },
        },
      }),
    },
    age: { type: new GraphQLNonNull(GraphQLInt) },
    active: { type: new GraphQLNonNull(GraphQLBoolean) },
    company: {
      type: new GraphQLNonNull(CompanyType),
      resolve: async (root, args) =>
        await axios
          .get(`http://localhost:3000/companies/${root.companyId}`)
          .then((res) => res.data),
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
    getCompanies: {
      type: new GraphQLList(CompanyType),
      resolve: async (root) =>
        await axios
          .get(`http://localhost:3000/companies`)
          .then((res) => res.data),
    },
    getEmployees: {
      type: new GraphQLList(EmployeeType),
      resolve: async (root) =>
        await axios
          .get(`http://localhost:3000/employees`)
          .then((res) => res.data),
    },
  },
});

const schema = new GraphQLSchema({
  query: RootQuery,
});

module.exports = { schema };
