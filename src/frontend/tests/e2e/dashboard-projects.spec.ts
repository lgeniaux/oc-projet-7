import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";

const apiURL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

for (const width of [1440, 375]) {
  test(`lists the projects with assigned tasks, most urgent first, at ${width}px`, async ({
    page,
    request,
  }) => {
    const id = randomUUID();
    const projectName = `Urgences ${id}`;
    const taskTitle = `Corriger la mise en ligne ${id}`;
    const authentication = await request.post(`${apiURL}/auth/login`, {
      data: { email: "alice@example.com", password: "P@ssword123" },
    });
    expect(authentication.status()).toBe(200);
    const authenticationBody: {
      data: { token: string; user: { id: string } };
    } = await authentication.json();
    const headers = {
      Authorization: `Bearer ${authenticationBody.data.token}`,
    };
    let projectId: string | undefined;

    try {
      // Only disposable records are changed; the public seed stays unchanged.
      const creation = await request.post(`${apiURL}/projects`, {
        headers,
        data: { name: projectName },
      });
      expect(creation.status()).toBe(201);
      const creationBody: { data: { project: { id: string } } } =
        await creation.json();
      projectId = creationBody.data.project.id;
      // The seed has no urgent task: this project must come before the seed ones.
      const taskCreation = await request.post(
        `${apiURL}/projects/${projectId}/tasks`,
        {
          headers,
          data: {
            title: taskTitle,
            priority: "URGENT",
            dueDate: "2026-03-09T00:00:00.000Z",
            assigneeIds: [authenticationBody.data.user.id],
          },
        },
      );
      expect(taskCreation.status()).toBe(201);

      await page.setViewportSize({ width, height: 900 });
      await page.goto("/login");
      await page
        .getByRole("textbox", { name: "E-mail", exact: true })
        .fill("alice@example.com");
      await page
        .getByLabel("Mot de passe", { exact: true })
        .fill("P@ssword123");
      await page.getByRole("button", { name: "Se connecter" }).click();
      await expect(page).toHaveURL("/");

      const projectsTab = page.getByRole("tab", {
        name: "Projets",
        exact: true,
      });
      await page.getByRole("tab", { name: "Liste", exact: true }).focus();
      await page.keyboard.press("ArrowRight");
      await expect(
        page.getByRole("tab", { name: "Kanban", exact: true }),
      ).toBeFocused();
      await page.keyboard.press("ArrowRight");
      await expect(projectsTab).toBeFocused();
      await expect(projectsTab).toHaveAttribute("aria-selected", "true");

      const list = page.getByRole("list", {
        name: "Projets avec des tâches assignées",
        exact: true,
      });
      await expect(
        list.getByRole("heading", { level: 3, name: projectName }),
      ).toBeVisible();
      const titles = await list
        .getByRole("heading", { level: 3 })
        .allTextContents();
      expect(titles).toContain("Plateforme de Formation");
      expect(titles.indexOf(projectName)).toBeLessThan(
        titles.indexOf("Plateforme de Formation"),
      );
      const card = list.getByRole("listitem").filter({
        has: page.getByRole("heading", { level: 3, name: projectName }),
      });
      await expect(card.getByText(taskTitle, { exact: true })).toBeVisible();
      await expect(card.getByText("Urgente", { exact: true })).toBeVisible();
      await expect(
        card.getByText("9 mars 2026", { exact: true }),
      ).toBeVisible();
      await expect(
        card.getByText("0/1 tâches terminées", { exact: true }),
      ).toBeVisible();

      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width);
      await page.screenshot({
        path: test.info().outputPath(`dashboard-projects-${width}.png`),
        fullPage: true,
      });

      const link = card.getByRole("link", { name: projectName, exact: true });
      await link.focus();
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(`/projects/${projectId}`);
      await expect(
        page.getByRole("heading", { level: 1, name: projectName }),
      ).toBeVisible();
    } finally {
      if (projectId) {
        const deletion = await request.delete(
          `${apiURL}/projects/${projectId}`,
          { headers },
        );
        expect(deletion.status()).toBe(200);
      }
    }
  });
}
