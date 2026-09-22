import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "@/app/page";

describe("HomePage", () => {
  it("présente la marque et annonce honnêtement la disponibilité", () => {
    render(<HomePage />);

    expect(screen.getByRole("img", { name: "Abricot" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Vos projets, en toute clarté.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Disponible prochainement" }),
    ).toBeDisabled();
  });
});
