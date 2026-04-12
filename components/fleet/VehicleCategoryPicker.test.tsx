import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { VehicleCategoryPicker } from "./VehicleCategoryPicker";

describe("VehicleCategoryPicker", () => {
  it("renders all 7 category labels", () => {
    render(
      <VehicleCategoryPicker value={undefined} onValueChange={vi.fn()} />,
    );
    expect(screen.getByText("Car")).toBeInTheDocument();
    expect(screen.getByText("Motorcycle")).toBeInTheDocument();
    expect(screen.getByText("Boat")).toBeInTheDocument();
    expect(screen.getByText("PWC")).toBeInTheDocument();
    expect(screen.getByText("Snowmobile")).toBeInTheDocument();
    expect(screen.getByText("ATV")).toBeInTheDocument();
    expect(screen.getByText("Seasonal Pass")).toBeInTheDocument();
  });

  it("calls onValueChange with 'motorcycle' when Motorcycle is clicked", () => {
    const onValueChange = vi.fn();
    render(
      <VehicleCategoryPicker value={undefined} onValueChange={onValueChange} />,
    );
    fireEvent.click(screen.getByRole("radio", { name: "Motorcycle" }));
    expect(onValueChange).toHaveBeenCalledWith("motorcycle");
  });

  it("calls onValueChange with 'car' when Car is clicked", () => {
    const onValueChange = vi.fn();
    render(
      <VehicleCategoryPicker value={undefined} onValueChange={onValueChange} />,
    );
    fireEvent.click(screen.getByRole("radio", { name: "Car" }));
    expect(onValueChange).toHaveBeenCalledWith("car");
  });

  it("calls onValueChange with 'seasonal_pass' when Seasonal Pass is clicked", () => {
    const onValueChange = vi.fn();
    render(
      <VehicleCategoryPicker value={undefined} onValueChange={onValueChange} />,
    );
    fireEvent.click(screen.getByRole("radio", { name: "Seasonal Pass" }));
    expect(onValueChange).toHaveBeenCalledWith("seasonal_pass");
  });

  it("renders the error message when error prop is provided", () => {
    render(
      <VehicleCategoryPicker
        value={undefined}
        onValueChange={vi.fn()}
        error="Select a vehicle category"
      />,
    );
    expect(
      screen.getByText("Select a vehicle category"),
    ).toBeInTheDocument();
  });

  it("does not render an error message when error prop is not provided", () => {
    render(
      <VehicleCategoryPicker value={undefined} onValueChange={vi.fn()} />,
    );
    expect(
      screen.queryByText("Select a vehicle category"),
    ).not.toBeInTheDocument();
  });

  it("marks selected category with data-state=on", () => {
    render(
      <VehicleCategoryPicker value="boat" onValueChange={vi.fn()} />,
    );
    const boatButton = screen.getByRole("radio", { name: "Boat" });
    expect(boatButton).toHaveAttribute("data-state", "on");
  });
});
