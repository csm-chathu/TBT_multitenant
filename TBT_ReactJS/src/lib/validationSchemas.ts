import * as yup from "yup";
import { isValidPhoneNumber } from "react-phone-number-input";

// Reusable phone number validator (uses react-phone-number-input helpers)
export const phoneNumberValidator = yup
  .string()
  .required("Phone number is required")
  .test(
    "valid-format",
    "Please enter a valid phone number",
    (value) => !!value && isValidPhoneNumber(value),
  );

// Reusable email validator
export const emailValidator = yup
  .string()
  .required("Email is required")
  .email("Please enter a valid email address");

// Reusable name validator (for first name, last name, etc.)
export const nameValidator = (fieldName: string = "Name") =>
  yup
    .string()
    .required(`${fieldName} is required`)
    .matches(
      /^[a-zA-Z\s\-']+$/,
      `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`
    )
    .min(2, `${fieldName} must be at least 2 characters`)
    .max(100, `${fieldName} must not exceed 100 characters`);

// Reusable required string validator with min/max
export const requiredStringValidator = (
  fieldName: string,
  minLength: number = 2,
  maxLength: number = 200
) =>
  yup
    .string()
    .required(`${fieldName} is required`)
    .min(minLength, `${fieldName} must be at least ${minLength} characters`)
    .max(maxLength, `${fieldName} must not exceed ${maxLength} characters`);

// Reusable HTML content validator (for rich text editors)
export const htmlContentValidator = (
  fieldName: string = "Field",
  minLength: number = 1,
  maxLength: number = 500
) =>
  yup
    .string()
    .required(`${fieldName} is required`)
    .test(
      "html-length",
      `${fieldName} must be between ${minLength} and ${maxLength} characters.`,
      (value) => {
        if (!value) return false;
        const textContent = value.replace(/<[^>]*>/g, "").trim();
        const length = textContent.length;
        return length >= minLength && length <= maxLength;
      }
    );

// Reusable ID validator (for select fields)
export const idValidator = (fieldName: string = "Field") =>
  yup
    .number()
    .required(`${fieldName} is required`)
    .test("not-zero", `${fieldName} is required`, (value) => 
      value !== undefined && value !== null && value > 0
    );

// Reusable date of birth validator with age check
export const dobValidator = (minAge: number = 18) =>
  yup
    .string()
    .required("Date of birth is required")
    .test("valid-date", "Date of birth cannot be in the future", (value) => {
      if (!value) return false;
      const dobDate = new Date(value);
      const today = new Date();
      return dobDate <= today;
    })
    .test("min-age", `Must be at least ${minAge} years old`, (value) => {
      if (!value) return false;
      const dobDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - dobDate.getFullYear();
      const monthDiff = today.getMonth() - dobDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) {
        return age - 1 >= minAge;
      }
      return age >= minAge;
    });

// Reusable address validator
export const addressValidator = yup
  .string()
  .required("Address is required")
  .min(5, "Address must be at least 5 characters")
  .max(200, "Address must not exceed 200 characters");

// Reusable oneOf validator (for select fields with specific options)
export const oneOfValidator = (
  fieldName: string,
  options: readonly string[],
  errorMessage?: string
) =>
  yup
    .string()
    .required(`${fieldName} is required`)
    .oneOf(options as string[], errorMessage || `Please select a valid ${fieldName.toLowerCase()}`);

// Reusable array validator (for multi-select fields)
export const arrayValidator = (
  fieldName: string,
  minLength: number = 1
) =>
  yup
    .array()
    .min(minLength, `${fieldName} is required`)
    .required(`${fieldName} is required`);

// Yup validation schema for Quick Ticket mode (only mandatory fields)
export const quickTicketValidationSchema = yup.object({
  heading: requiredStringValidator("Ticket Heading/Body", 3, 200),
  phoneNumber: phoneNumberValidator,
  application: yup
    .string()
    .required("Please select an application")
    .test("not-empty", "Please select an application", (value) => value !== ""),
  agent: yup
    .string()
    .required("Please select an agent")
    .test("not-empty", "Please select an agent", (value) => value !== ""),
  priority: oneOfValidator("Priority", ["Low", "Medium", "High", "Critical"] as const),
});

export const helpDeskQuickValidationSchema = quickTicketValidationSchema;

// Helper function to extract validation errors from Yup
export const extractValidationErrors = (error: unknown): Record<string, string> => {
  if (error instanceof yup.ValidationError) {
    const validationErrors: Record<string, string> = {};
    error.inner.forEach((err) => {
      if (err.path) {
        validationErrors[err.path] = err.message;
      }
    });
    return validationErrors;
  }
  return {};
};

// Helper function to validate form with Yup schema
export const validateForm = async (
  schema: yup.AnyObjectSchema | yup.ObjectSchema<any>,
  data: any
): Promise<{ isValid: boolean; errors: Record<string, string> }> => {
  try {
    await schema.validate(data, { abortEarly: false });
    return { isValid: true, errors: {} };
  } catch (validationError) {
    const errors = extractValidationErrors(validationError);
    return { isValid: false, errors };
  }
};

