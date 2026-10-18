import { makeEmployee } from "@/test/factories";
import { Table, TableBody } from "@mui/material";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import RecentProfilesTableRow from "./RecentProfilesTableRow";

const renderRow = (employee = makeEmployee()) =>
  render(
    <MemoryRouter>
      <Table>
        <TableBody>
          <RecentProfilesTableRow employee={employee} />
        </TableBody>
      </Table>
    </MemoryRouter>,
  );

describe("RecentProfilesTableRow", () => {
  it("links the employee name to their profile", () => {
    renderRow(makeEmployee({ id: "abc-123", fullName: "Alice Active" }));

    expect(screen.getByRole("link", { name: "Alice Active" })).toHaveAttribute(
      "href",
      "/employees/abc-123",
    );
  });

  it("shows an Active status for active employees", () => {
    renderRow(makeEmployee({ isActive: true }));

    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.queryByText("Inactive")).not.toBeInTheDocument();
  });

  it("shows an Inactive status for inactive employees", () => {
    renderRow(makeEmployee({ isActive: false }));

    expect(screen.getByText("Inactive")).toBeInTheDocument();
    expect(screen.queryByText("Active")).not.toBeInTheDocument();
  });
});
