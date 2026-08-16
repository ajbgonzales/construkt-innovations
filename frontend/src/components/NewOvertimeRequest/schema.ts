import { type Dayjs } from "dayjs";
import { z } from "zod";
import type { Employee } from "@/api/employees";

export const overtimeRequestSchema = z
  .object({
    date: z
      .custom<Dayjs | null>()
      .refine((value): value is Dayjs => value !== null, {
        message: "Date is required",
      }),
    projectId: z.string().min(1, "Project is required"),
    startTime: z
      .custom<Dayjs | null>()
      .refine((value): value is Dayjs => value !== null, {
        message: "Start time is required",
      }),
    endTime: z
      .custom<Dayjs | null>()
      .refine((value): value is Dayjs => value !== null, {
        message: "End time is required",
      }),
    employees: z
      .custom<Employee[]>()
      .refine((value) => Array.isArray(value) && value.length > 0, {
        message: "At least one employee is required",
      }),
    activities: z.string().trim().min(1, "Activities is required"),
  })
  .refine(
    (data) =>
      !data.startTime || !data.endTime || data.endTime.isAfter(data.startTime),
    {
      message: "End time must be after start time",
      path: ["endTime"],
    },
  );

export type OvertimeRequestFormValues = z.infer<typeof overtimeRequestSchema>;
export type OvertimeRequestFormInput = z.input<typeof overtimeRequestSchema>;
