import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "@/app/page";

describe("HomePage", () => {
  it("présente Abricot et son état initial", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Abricot" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Votre espace de gestion de projets arrive bientôt/),
    ).toBeInTheDocument();
  });
});
