interface FormControl {
  id: string;
  name: string;
  label: string;
  isRequired: boolean;
  type?: "text" | "number";
}

export const PERSONAL_INFO_ITEMS: FormControl[] = [
  {
    id: "full-name-text-field",
    name: "fullName",
    label: "Full Name",
    isRequired: true,
    type: "text",
  },
  {
    id: "email-address-text-field",
    name: "emailAddress",
    label: "Email Address",
    isRequired: false,
    type: "text",
  },
  {
    id: "contact-number-text-field",
    name: "contactNumber",
    label: "Contact Number",
    isRequired: false,
    type: "text",
  },
];

export const PROJECT_INFO_ITEMS: FormControl[] = [
  {
    id: "employee-id-text-field",
    name: "employeeId",
    label: "Employee ID",
    isRequired: true,
    type: "text",
  },
  {
    id: "project-text-field",
    name: "project",
    label: "Project",
    isRequired: true,
    type: "text",
  },
  {
    id: "position-text-field",
    name: "position",
    label: "Position",
    isRequired: true,
    type: "text",
  },
];

export const RATE_AND_BENEFITS_ITEMS: FormControl[] = [
  {
    id: "rate-number-field",
    name: "rate",
    label: "Rate",
    isRequired: true,
    type: "number",
  },
  {
    id: "allowance-number-field",
    name: "allowance",
    label: "Allowance",
    isRequired: true,
    type: "number",
  },
  {
    id: "sss-number-field",
    name: "sss",
    label: "SSS",
    isRequired: true,
    type: "number",
  },
  {
    id: "hdmf-number-field",
    name: "hdmf",
    label: "HDMF",
    isRequired: true,
    type: "number",
  },
  {
    id: "phic-number-field",
    name: "phic",
    label: "PHIC",
    isRequired: true,
    type: "number",
  },
  {
    id: "others-number-field",
    name: "others",
    label: "Others",
    isRequired: true,
    type: "number",
  },
];
