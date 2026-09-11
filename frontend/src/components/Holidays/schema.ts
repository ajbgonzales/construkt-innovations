import { type Dayjs } from "dayjs";
import { z } from "zod";

export const holidaySchema = z.object({
  date: z
    .custom<Dayjs | null>()
    .refine((value): value is Dayjs => value !== null, {
      message: "Date is required",
    }),
  name: z.string().trim().min(1, "Name is required"),
  type: z.enum(["regular", "special_non_working"], {
    message: "Type is required",
  }),
});

export type HolidayFormValues = z.infer<typeof holidaySchema>;
export type HolidayFormInput = z.input<typeof holidaySchema>;
