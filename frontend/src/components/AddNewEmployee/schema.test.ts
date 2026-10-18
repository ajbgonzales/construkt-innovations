import { describe, expect, it } from "vitest";
import { addNewEmployeeSchema, type AddNewEmployeeFormInput } from "./schema";

const validInput: AddNewEmployeeFormInput = {
  fullName: "Alice Active",
  emailAddress: "",
  contactNumber: "",
  employeeId: "1001",
  project: "Test Project",
  position: "Laborer",
  isActive: true,
  rate: "600",
  allowance: "50",
  sss: "100",
  hdmf: "50",
  phic: "75",
  others: "20",
};

const errorFor = (input: unknown, field: string) => {
  const result = addNewEmployeeSchema.safeParse(input);
  expect(result.success).toBe(false);
  return result.error?.issues.find((issue) => issue.path[0] === field)?.message;
};

describe("addNewEmployeeSchema", () => {
  it("parses numeric strings into numbers", () => {
    const parsed = addNewEmployeeSchema.parse(validInput);

    expect(parsed.rate).toBe(600);
    expect(parsed.others).toBe(20);
  });

  it.each([true, false])("keeps isActive=%s", (isActive) => {
    expect(addNewEmployeeSchema.parse({ ...validInput, isActive }).isActive).toBe(
      isActive,
    );
  });

  it("requires isActive to be a boolean", () => {
    expect(errorFor({ ...validInput, isActive: "active" }, "isActive")).toBeDefined();
  });

  it("labels the others field as Other Loans in errors", () => {
    expect(errorFor({ ...validInput, others: "" }, "others")).toBe(
      "Other Loans is required",
    );
    expect(errorFor({ ...validInput, others: "abc" }, "others")).toBe(
      "Other Loans must be a number",
    );
    expect(errorFor({ ...validInput, others: "-1" }, "others")).toBe(
      "Other Loans must be greater than or equal to 0",
    );
  });

  it("rejects an invalid email address", () => {
    expect(errorFor({ ...validInput, emailAddress: "nope" }, "emailAddress")).toBe(
      "Enter a valid email address",
    );
  });
});
