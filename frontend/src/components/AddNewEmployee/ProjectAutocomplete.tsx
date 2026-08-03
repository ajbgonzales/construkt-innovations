import { FormHelperText, TextField } from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import {
  createFilterOptions,
  type FilterOptionsState,
} from "@mui/material/useAutocomplete";
import { useQuery } from "@tanstack/react-query";
import { Controller, type Control } from "react-hook-form";
import { getProjects } from "@/api/projects";
import type {
  AddNewEmployeeFormInput,
  AddNewEmployeeFormValues,
} from "./schema";

const ADD_PROJECT_PREFIX = 'Add "';

const projectFilter = createFilterOptions<string>();

const filterProjectOptions = (
  options: string[],
  params: FilterOptionsState<string>,
) => {
  const filtered = projectFilter(options, params);
  const { inputValue } = params;
  const isExisting = options.some((option) => option === inputValue);
  if (inputValue !== "" && !isExisting) {
    filtered.push(`${ADD_PROJECT_PREFIX}${inputValue}"`);
  }
  return filtered;
};

const stripAddProjectPrefix = (value: string): string =>
  value.startsWith(ADD_PROJECT_PREFIX) && value.endsWith('"')
    ? value.slice(ADD_PROJECT_PREFIX.length, -1)
    : value;

interface ProjectAutocompleteProps {
  id: string;
  control: Control<AddNewEmployeeFormInput, unknown, AddNewEmployeeFormValues>;
}

const ProjectAutocomplete = ({ id, control }: ProjectAutocompleteProps) => {
  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: getProjects,
  });
  const projectNames = projects.map((project) => project.name);

  return (
    <Controller
      name="project"
      control={control}
      render={({ field, fieldState }) => (
        <>
          <Autocomplete
            freeSolo
            clearOnBlur
            options={projectNames}
            filterOptions={filterProjectOptions}
            value={typeof field.value === "string" ? field.value : ""}
            onChange={(_event, newValue) => {
              field.onChange(stripAddProjectPrefix(newValue ?? ""));
            }}
            onBlur={field.onBlur}
            renderInput={(params) => (
              <TextField {...params} id={id} error={!!fieldState.error} />
            )}
          />
          {fieldState.error && (
            <FormHelperText error>{fieldState.error.message}</FormHelperText>
          )}
        </>
      )}
    />
  );
};

export default ProjectAutocomplete;
