import { Request, Response, NextFunction, RequestHandler } from 'express';
import { JSONSchemaType } from 'ajv';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

export function validateRequest<T>(schema: JSONSchemaType<T>): RequestHandler {
  const validate = ajv.compile(schema);

  return (req: Request, res: Response, next: NextFunction): void => {
    console.log('🔍 Incoming body:', req.body);

    const valid = validate(req.body);
    if (!valid) {
      console.error('Validation error:', validate.errors);
      res.status(400).json({
        errors: validate.errors?.map((err) => ({
          field: err.instancePath || err.schemaPath,
          message: err.message,
        })),
      });
      return;
    }

    next();
  };
}
