import { z } from "zod";

const requiredNumberField = (label: string) =>
  z
    .string()
    .min(1, `${label} is required`)
    .transform((val, ctx) => {
      const parsed = Number(val);
      if (Number.isNaN(parsed)) {
        ctx.addIssue({ code: "custom", message: `${label} must be a number` });
        return z.NEVER;
      }
      return parsed;
    })
    .pipe(z.number().gte(0, `${label} must be greater than or equal to 0`));

export const addNewEmployeeSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  emailAddress: z
    .union([z.email("Enter a valid email address"), z.literal("")])
    .optional(),
  contactNumber: z.string().optional(),
  employeeId: z.string().min(1, "Employee ID is required"),
  project: z.string().min(1, "Project is required"),
  position: z.string().min(1, "Position is required"),
  rate: requiredNumberField("Rate"),
  allowance: requiredNumberField("Allowance"),
  sss: requiredNumberField("SSS"),
  hdmf: requiredNumberField("HDMF"),
  phic: requiredNumberField("PHIC"),
  others: requiredNumberField("Others"),
});

export type AddNewEmployeeFormValues = z.infer<typeof addNewEmployeeSchema>;
export type AddNewEmployeeFormInput = z.input<typeof addNewEmployeeSchema>;
