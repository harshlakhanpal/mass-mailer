import { JSONSchemaType } from 'ajv';

export interface AuthSchema {
  email: string;
  password: string;
}

export const registerSchema: JSONSchemaType<AuthSchema> = {
  type: 'object',
  properties: {
    email: { type: 'string', format: 'email' },
    password: { type: 'string', minLength: 6 },
  },
  required: ['email', 'password'],
  additionalProperties: false,
};
