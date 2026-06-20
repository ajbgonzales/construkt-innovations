import { create } from "zustand";

export interface ProjectMetadata {
  projectName: string;
  startTime: string;
  isCompressed: boolean;
  isOvertime: boolean;
  workingDays: number;
}

interface AttendanceStore {
  files: File[];
  values: Record<string, ProjectMetadata>;
  setFiles: (newFiles: File[]) => void;
  removeFile: (fileName: string) => void;
  updateValues: (
    key: string,
    field: keyof ProjectMetadata,
    value: string | boolean | null,
  ) => void;
}

const useAttendanceStore = create<AttendanceStore>((set) => ({
  files: [],
  values: {},
  setFiles: (newFiles) => {
    set((state) => {
      const dedupedFiles = newFiles.filter(
        (newFile) =>
          !state.files.some((existing) => existing.name === newFile.name),
      );

      const initialValues: Record<string, ProjectMetadata> = {};
      dedupedFiles.forEach((file) => {
        initialValues[`${file.name}`] = {
          projectName: "",
          startTime: "08:00",
          isCompressed: false,
          isOvertime: false,
          workingDays: 5,
        };
      });

      return {
        files: [...state.files, ...dedupedFiles],
        values: { ...state.values, ...initialValues },
      };
    });
  },
  removeFile: (fileName) => {
    set((state) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [fileName]: _, ...remainingValues } = state.values;
      return {
        files: state.files.filter((f) => f.name !== fileName),
        values: remainingValues,
      };
    });
  },
  updateValues: (key, field, value) => {
    set((state) => ({
      values: {
        ...state.values,
        [key]: {
          ...state.values[key],
          [field]: value,
        },
      },
    }));
  },
}));

export default useAttendanceStore;
