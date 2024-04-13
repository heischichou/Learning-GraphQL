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

const CompanyFields = ["id", "name", "geo"];

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

const genderEnum = {
  name: "Gender",
  values: {
    Male: { value: "Male" },
    Female: { value: "Female" },
    Other: { value: "Other" },
  },
};

const NullableGenderEnum = new GraphQLEnumType({ ...genderEnum });

const GenderEnum = new GraphQLNonNull(NullableGenderEnum);

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
    gender: { type: GenderEnum },
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
      gender: { type: GenderEnum },
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
          const company = await axios
            .get(`http://localhost:3000/companies/${companyId}`)
            .then((res) => res.data);

          if (company) {
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

const PUT = {
  updateEmployee: {
    type: EmployeeType,
    args: {
      id: { type: new GraphQLNonNull(GraphQLString) },
      name: { type: GraphQLString },
      position: { type: GraphQLString },
      gender: { type: NullableGenderEnum },
      age: { type: GraphQLInt },
      active: { type: GraphQLBoolean },
      companyId: { type: GraphQLString },
    },
    resolve: async (root, args) => {
      try {
        // Check if arguments are not undefined
        const argsAreNotUndefined = Object.keys(args).every(
          (field) => args[field]
        );

        if (argsAreNotUndefined) {
          const { id } = args;

          // Check if companyId argument exists
          if (args.companyId) {
            // Check if companyId exists in the list of companies
            const { companyId } = args;
            const company = await axios
              .get(`http://localhost:3000/companies/${companyId}`)
              .then((res) => res.data);

            if (company) {
              // Update employee
              return await axios
                .put(`http://localhost:3000/employees/${id}`, { ...args })
                .then((res) => res.data);
            } else {
              throw new Error(`Company with id ${companyId} not found.`);
            }
          } else {
            // Update employee
            return await axios
              .put(`http://localhost:3000/employees/${id}`, { ...args })
              .then((res) => res.data);
          }
        }
      } catch (error) {
        console.log(error);
      }
    },
  },
  updateCompany: {
    type: CompanyType,
    args: {
      id: { type: new GraphQLNonNull(GraphQLString) },
      name: { type: GraphQLString },
      geo: { type: GraphQLString },
    },
    resolve: async (root, args) => {
      try {
        // Check if all values are not undefined or null
        const argsAreNotNull = CompanyFields.every(
          (field) => args.hasOwnProperty(field) && args[field]
        );

        if (argsAreNotNull) {
          const { id } = args;
          return await axios
            .put(`http://localhost:3000/companies/${id}`, { ...args })
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

const DELETE = {
  deleteEmployee: {
    type: EmployeeType,
    args: {
      id: { type: new GraphQLNonNull(GraphQLString) },
    },
    resolve: async (root, { id }) => {
      try {
        return await axios
          .delete(`http://localhost:3000/employees/${id}`)
          .then((res) => res.data);
      } catch (error) {
        console.log(error);
      }
    },
  },
  deleteCompany: {
    type: CompanyType,
    args: {
      id: { type: new GraphQLNonNull(GraphQLString) },
    },
    resolve: async (root, { id }) => {
      try {
        const employees = await axios
          .get(`http://localhost:3000/employees?companyId=${id}`)
          .then((res) => res.data);

        if (employees) {
          for(const employee of employees) {
            await axios
              .delete(`http://localhost:3000/employees/${employee.id}`)
              .then((res) => res.data);
          }
        }

        return await axios
          .delete(`http://localhost:3000/companies/${id}`)
          .then((res) => res.data);
      } catch (error) {
        console.log(error);
      }
    },
  },
};

const mutations = {
  ...GET,
  ...POST,
  ...PUT,
  ...DELETE,
};

const RootQuery = new GraphQLObjectType({
  name: "RootQuery",
  fields: {
    uuid: {
      type: uuid,
      resolve: () => ({}),
    },
    ...mutations
  },
});

const schema = new GraphQLSchema({
  query: RootQuery,
});

module.exports = { schema };
