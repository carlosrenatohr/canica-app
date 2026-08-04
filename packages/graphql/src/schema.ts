// GraphQL schema SDL for canica.
// Yoga compone este string; el codegen produce SDK tipado desde introspection.
export const typeDefs = /* GraphQL */ `
  scalar DateTime
  scalar UUID

  directive @orgScope on OBJECT

  type Query {
    health: HealthPayload
    me: User
    patients(archived: Boolean = false): [Patient!]!
    patient(id: UUID!): Patient
  }

  type Mutation {
    # Organization-scoped mutations enforce an authenticated session.
    createPatient(input: CreatePatientInput!): Patient
    updatePatient(id: UUID!, input: UpdatePatientInput!): Patient
    archivePatient(id: UUID!): Boolean
  }

  type HealthPayload {
    ok: Boolean!
    service: String!
  }

  type User {
    id: UUID!
    email: String!
    name: String!
    role: String!
  }

  type Patient {
    id: UUID!
    organizationId: UUID!
    firstName: String!
    lastName: String!
    identifier: String
    birthDate: DateTime
    sex: String
    phone: String
    email: String
    address: String
    archived: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input CreatePatientInput {
    firstName: String!
    lastName: String!
    identifier: String
    birthDate: DateTime
    sex: String
    phone: String
    email: String
    address: String
  }

  input UpdatePatientInput {
    firstName: String
    lastName: String
    identifier: String
    birthDate: DateTime
    sex: String
    phone: String
    email: String
    address: String
  }
`;
