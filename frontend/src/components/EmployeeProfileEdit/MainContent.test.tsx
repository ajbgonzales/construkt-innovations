import api from "@/api/base";
import { makeEmployee } from "@/test/factories";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MainContent from "./MainContent";

vi.mock("@/api/base", () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}));
vi.mock("@/api/projects", () => ({
  getProjects: vi.fn().mockResolvedValue([]),
}));

const renderEditForm = (employee = makeEmployee()) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <MainContent employee={employee} />
      </MemoryRouter>
    </QueryClientProvider>,
  );

// The project autocomplete is also a combobox, so pick the status one by id.
const statusSelect = () => {
  const select = screen
    .getAllByRole("combobox")
    .find((element) => element.id === "is-active-select-field");
  if (!select) throw new Error("Status select not found");
  return select;
};

describe("EmployeeProfileEdit MainContent", () => {
  beforeEach(() => {
    vi.mocked(api.put).mockReset().mockResolvedValue({ data: {} });
  });

  it("preselects the employee's current status", () => {
    renderEditForm(makeEmployee({ isActive: false }));

    expect(statusSelect()).toHaveTextContent("Inactive");
  });

  it("submits isActive=false after marking the employee inactive", async () => {
    const user = userEvent.setup();
    renderEditForm(makeEmployee({ id: "employee-1", isActive: true }));

    await user.click(statusSelect());
    await user.click(await screen.findByRole("option", { name: "Inactive" }));
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => expect(api.put).toHaveBeenCalledTimes(1));
    expect(api.put).toHaveBeenCalledWith(
      "/employees/employee-1",
      expect.objectContaining({ isActive: false, others: 20 }),
    );
  });
});
