interface ProjectAndEmployee {
  projectName: string;
  employeeFullName: string;
}

export const sortByProjectThenEmployee = (
  a: ProjectAndEmployee,
  b: ProjectAndEmployee,
): number =>
  a.projectName.localeCompare(b.projectName) ||
  a.employeeFullName.localeCompare(b.employeeFullName);
