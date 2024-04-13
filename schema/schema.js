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


const CompanyFields = [
  "id",
  "name",
  "geo",
];

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

const GenderEnum = {
  type: new GraphQLNonNull(
    new GraphQLEnumType({
      name: "Gender",
      values: {
        Male: { value: "Male" },
        Female: { value: "Female" },
        Other: { value: "Other" },
      },
    })
  ),
};

const EmployeeFields = [
  "id",
  "name",
  "position",
  "gender",
  "active",
  "active",
  "companyId",
];

const EmployeeType = new GraphQLObjectType({
  name: "Employee",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLString) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    position: { type: new GraphQLNonNull(GraphQLString) },
    gender: { ...GenderEnum },
    age: { type: new GraphQLNonNull(GraphQLInt) },
    active: { type: new GraphQLNonNull(GraphQLBoolean) },
    companyId: { type: new GraphQLNonNull(GraphQLString) },
    company: {
      type: new GraphQLNonNull(CompanyType),
      resolve: async (root, args) =>
        await axios
          .get(`http://localhost:3000/companies/${root.companyId}`)
          .then((res) => res.data),
    },
  }),
});

const GET = {
  company: {
    type: CompanyType,
    args: {
      id: { type: new GraphQLNonNull(GraphQLString) },
    },
    resolve: async (root, { id }) =>
      await axios
        .get(`http://localhost:3000/companies/${id}`)
        .then((res) => res.data),
  },
  employee: {
    type: EmployeeType,
    args: {
      id: { type: new GraphQLNonNull(GraphQLString) },
    },
    resolve: async (root, { id }) =>
      await axios
        .get(`http://localhost:3000/employees/${id}`)
        .then((res) => res.data),
  },
  companies: {
    type: new GraphQLList(CompanyType),
    resolve: async (root) =>
      await axios
        .get(`http://localhost:3000/companies`)
        .then((res) => res.data),
  },
  employees: {
    type: new GraphQLList(EmployeeType),
    resolve: async (root) =>
      await axios
        .get(`http://localhost:3000/employees`)
        .then((res) => res.data),
  },
};

const POST = {
  createEmployee: {
    type: EmployeeType,
    args: {
      id: { type: new GraphQLNonNull(GraphQLString) },
      name: { type: new GraphQLNonNull(GraphQLString) },
      position: { type: new GraphQLNonNull(GraphQLString) },
      gender: { ...GenderEnum },
      age: { type: new GraphQLNonNull(GraphQLInt) },
      active: { type: new GraphQLNonNull(GraphQLBoolean) },
      companyId: { type: new GraphQLNonNull(GraphQLString) },
    },
    resolve: async (root, args) => {
      try {
        // Check if all values are not undefined or null
        const argsAreNotNull = EmployeeFields.every(
          (field) => args.hasOwnProperty(field) && args[field]
        );

        if (argsAreNotNull) {
          const { companyId } = args;

          // Check if companyId exists in the list of companies
          const companies = await axios
            .get("http://localhost:3000/companies")
            .then((res) => res.data);
          const companyExists = companies.some(
            (company) => company.id === companyId
          );

          if (companyExists) {
            // Create employee
            return await axios
              .post("http://localhost:3000/employees", { ...args })
              .then((res) => res.data);
          } else {
            throw new Error(`Company with id ${companyId} not found.`);
          }
        }
      } catch (error) {
        console.log(error);
      }
    },
  },
  createCompany: {
    type: CompanyType,
    args: {
      id: { type: new GraphQLNonNull(GraphQLString) },
      name: { type: new GraphQLNonNull(GraphQLString) },
      geo: { type: new GraphQLNonNull(GraphQLString) },
    },
    resolve: async (root, args) => {
      try {
        // Check if all values are not undefined or null
        const argsAreNotNull = CompanyFields.every(
          (field) => args.hasOwnProperty(field) && args[field]
        );

        if (argsAreNotNull) {
          // Create company
          return await axios
            .post("http://localhost:3000/companies", { ...args })
            .then((res) => res.data);
        } else {
          throw new Error(`An error occured. Please try again later.`);
        }
      } catch (error) {
        console.log(error);
      }
    },
  },
};

const RootQuery = new GraphQLObjectType({
  name: "RootQuery",
  fields: {
    uuid: {
      type: uuid,
      resolve: () => ({}),
    },
    ...GET,
    ...POST,
  },
});

const schema = new GraphQLSchema({
  query: RootQuery,
});

module.exports = { schema };

// {
//   createEmployee(
//     id: "2df17134-7810-4a2a-a470-19d6056193ca",
//     name: "Therese Celestine",
//     position: "Senior Manager",
//     gender: Female,
//     age: 27,
//     active: true,
//     companyId: "21ecaa16-2905-4762-aacb-17e17c8e0e10"
//   ) {
//     id,
//     name,
//     position,
//     gender,
//     age,
//     active,
//     companyId
//   }
// } 006b1086-8e12-4675-873c-48b72e602500
