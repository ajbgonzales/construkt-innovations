import { makeEmployee } from "@/test/factories";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import MainContent from "./MainContent";

describe("EmployeeProfile MainContent", () => {
  it("shows the employee's status", () => {
    render(<MainContent employee={makeEmployee({ isActive: false })} />);

    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Inactive")).toBeInTheDocument();
  });

  it("labels the others deduction as Other Loans", () => {
    render(<MainContent employee={makeEmployee({ others: 20 })} />);

    expect(screen.getByText("Other Loans")).toBeInTheDocument();
    expect(screen.queryByText("Others")).not.toBeInTheDocument();
  });

  it("shows a dash for missing contact details", () => {
    render(
      <MainContent
        employee={makeEmployee({ emailAddress: null, contactNumber: null })}
      />,
    );

    expect(screen.getAllByText("-")).toHaveLength(2);
  });
});
