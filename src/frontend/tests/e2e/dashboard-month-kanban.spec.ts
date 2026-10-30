import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";

const apiURL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

for (const width of [1440, 375]) {
  test(`switches to the month Kanban and opens a task at ${width}px`, async ({
    page,
    request,
  }) => {
    const id = randomUUID();
    const projectName = `Kanban ${id}`;
    const todoTitle = `À planifier ${id}`;
    const inProgressTitle = `En production ${id}`;
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
    // The 15th at noon UTC is in the current month in every common time zone.
    const now = new Date();
    const dueDate = new Date(
      Date.UTC(now.getFullYear(), now.getMonth(), 15, 12),
    ).toISOString();
    const currentMonth = new Intl.DateTimeFormat("fr-FR", {
      month: "long",
      year: "numeric",
    }).format(now);
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
      const tasksURL = `${apiURL}/projects/${projectId}/tasks`;
      for (const title of [todoTitle, inProgressTitle]) {
        const taskCreation = await request.post(tasksURL, {
          headers,
          data: {
            title,
            dueDate,
            assigneeIds: [authenticationBody.data.user.id],
          },
        });
        expect(taskCreation.status()).toBe(201);
        if (title === inProgressTitle) {
          // Express ignores the status at creation.
          const taskBody: { data: { task: { id: string } } } =
            await taskCreation.json();
          const update = await request.put(
            `${tasksURL}/${taskBody.data.task.id}`,
            { headers, data: { status: "IN_PROGRESS" } },
          );
          expect(update.status()).toBe(200);
        }
      }

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

      // Radix tabs: the arrow key moves the focus and selects the view.
      const listTab = page.getByRole("tab", { name: "Liste", exact: true });
      const kanbanTab = page.getByRole("tab", { name: "Kanban", exact: true });
      await listTab.focus();
      await page.keyboard.press("ArrowRight");
      await expect(kanbanTab).toBeFocused();
      await expect(kanbanTab).toHaveAttribute("aria-selected", "true");
      await expect(
        page.getByRole("region", { name: "Mes tâches assignées" }),
      ).toHaveCount(0);

      const kanban = page.getByRole("region", {
        name: "Mes tâches du mois",
        exact: true,
      });
      await expect(
        kanban.getByRole("group", { name: "Mois affiché" }),
      ).toContainText(currentMonth);
      const columns = {
        todo: kanban.getByRole("region", { name: /^À faire \d+ tâches?$/ }),
        inProgress: kanban.getByRole("region", {
          name: /^En cours \d+ tâches?$/,
        }),
        done: kanban.getByRole("region", { name: /^Terminées \d+ tâches?$/ }),
      };
      await expect(
        columns.todo.getByRole("heading", { level: 4, name: todoTitle }),
      ).toBeVisible();
      await expect(
        columns.inProgress.getByRole("heading", {
          level: 4,
          name: inProgressTitle,
        }),
      ).toBeVisible();
      for (const column of Object.values(columns)) {
        const cardCount = await column.getByRole("listitem").count();
        await expect(column.getByRole("heading", { level: 3 })).toHaveText(
          new RegExp(` ${cardCount} tâches?$`),
        );
      }

      // Moving to the next month and back keeps the same tasks.
      await kanban.getByRole("button", { name: "Mois suivant" }).click();
      await expect(
        kanban.getByRole("heading", { level: 4, name: todoTitle }),
      ).toHaveCount(0);
      await kanban.getByRole("button", { name: "Mois précédent" }).click();
      await expect(
        columns.todo.getByRole("heading", { level: 4, name: todoTitle }),
      ).toBeVisible();

      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width);
      await page.screenshot({
        path: test.info().outputPath(`dashboard-month-kanban-${width}.png`),
        fullPage: true,
      });

      const viewLink = columns.inProgress.getByRole("link", {
        name: `Voir la tâche « ${inProgressTitle} »`,
        exact: true,
      });
      await viewLink.focus();
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(new RegExp(`/projects/${projectId}#task-`));
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
