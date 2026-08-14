import { ApiError, ErrorCode } from './envelope';

type FieldName = string;

export interface ValidationResult {
  ok: boolean;
  errors: { field: string; message: string }[];
}

export interface FieldSpec {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required?: boolean;
  enum?: readonly string[];
  min?: number;
  max?: number;
  default?: unknown;
}

export interface ContractSpec {
  fields: Record<FieldName, FieldSpec>;
  strict: boolean;
}

export function defineContract(input: {
  fields: Record<FieldName, FieldSpec>;
  strict?: boolean;
}): ContractSpec {
  return { fields: input.fields, strict: input.strict ?? true };
}

function typeMessage(value: unknown, spec: FieldSpec): string {
  const actual = Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value;
  return `must be a ${spec.type}${spec.type === 'string' ? ` (got ${actual})` : ''}`;
}

export function validateContract<T extends Record<string, unknown>>(
  contract: ContractSpec,
  input: unknown,
): ValidationResult {
  const errors: { field: string; message: string }[] = [];
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, errors: [{ field: '_', message: 'body must be a JSON object' }] };
  }
  const body = input as Record<string, unknown>;
  const allowed = Object.keys(contract.fields);

  if (contract.strict) {
    for (const key of Object.keys(body)) {
      if (!allowed.includes(key)) {
        errors.push({ field: key, message: `unknown field not allowed by contract` });
      }
    }
  }

  for (const [name, spec] of Object.entries(contract.fields)) {
    const has = Object.prototype.hasOwnProperty.call(body, name);
    const value = body[name];
    if (!has) {
      if (spec.required) {
        errors.push({ field: name, message: 'is required' });
      } else if (spec.default !== undefined) {
        body[name] = spec.default;
      }
      continue;
    }
    if (value === null || value === undefined) {
      if (spec.required) errors.push({ field: name, message: 'is required' });
      continue;
    }
    const validType =
      spec.type === 'number'
        ? typeof value === 'number' && Number.isFinite(value)
        : spec.type === 'array'
          ? Array.isArray(value)
          : spec.type === 'object'
            ? typeof value === 'object' && !Array.isArray(value)
            : typeof value === spec.type;
    if (!validType) {
      errors.push({ field: name, message: typeMessage(value, spec) });
      continue;
    }
    if (spec.type === 'string') {
      const s = value as string;
      if (spec.min !== undefined && s.length < spec.min) errors.push({ field: name, message: `must be at least ${spec.min} characters` });
      if (spec.max !== undefined && s.length > spec.max) errors.push({ field: name, message: `must be at most ${spec.max} characters` });
    }
    if (spec.type === 'number') {
      const n = value as number;
      if (spec.min !== undefined && n < spec.min) errors.push({ field: name, message: `must be >= ${spec.min}` });
      if (spec.max !== undefined && n > spec.max) errors.push({ field: name, message: `must be <= ${spec.max}` });
    }
    if (spec.type === 'string' && spec.enum && !spec.enum.includes(value as string)) {
      errors.push({ field: name, message: `must be one of: ${spec.enum.join(', ')}` });
    }
  }

  return { ok: errors.length === 0, errors };
}

export function assertValid<T extends Record<string, unknown>>(contract: ContractSpec, input: unknown): T {
  const result = validateContract(contract, input);
  if (!result.ok) {
    const detail = result.errors.map((e) => `${e.field}: ${e.message}`).join('; ');
    throw new ApiError(ErrorCode.VALIDATION_ERROR, `Validation failed: ${detail}`, 400);
  }
  return input as T;
}