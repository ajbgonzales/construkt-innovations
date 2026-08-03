import api from "./base";

export interface Project {
  id: string;
  name: string;
}

export const getProjects = async (): Promise<Project[]> => {
  const { data } = await api.get<Project[]>("/projects");
  return data;
};
