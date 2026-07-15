import {
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
} from 'class-validator';

export function Match(
  property: string,
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (object: object, propertyName: string | symbol) => {
    registerDecorator({
      name: 'match',
      target: object.constructor,
      propertyName: String(propertyName),
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          const [relatedPropertyName] = args.constraints as [string];
          const relatedValue = (args.object as Record<string, unknown>)[
            relatedPropertyName
          ];
          return value === relatedValue;
        },
        defaultMessage(args: ValidationArguments): string {
          const [relatedPropertyName] = args.constraints as [string];
          return `${args.property} must match ${relatedPropertyName}`;
        },
      },
    });
  };
}
