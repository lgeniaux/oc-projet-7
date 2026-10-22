import { expect, test, type Locator } from "@playwright/test";

type AssignedTask = {
  id: string;
  title: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED";
  priority: "URGENT" | "HIGH" | "MEDIUM" | "LOW";
  dueDate: string | null;
  project: { id: string; name: string };
  assignees: { user: { email: string } }[];
  comments: { id: string }[];
};

const priorityRank = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 } as const;
const statusLabels = {
  TODO: "À faire",
  IN_PROGRESS: "En cours",
  DONE: "Terminée",
  CANCELLED: "Annulée",
} as const;
const frenchCalendarDate = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

async function expectUsableTarget(target: Locator, viewportWidth: number) {
  await expect(target).toBeVisible();
  await expect(target).toBeEnabled();
  await target.scrollIntoViewIfNeeded();
  const bounds = await target.evaluate((element) => {
    const { left, right, width, height } = element.getBoundingClientRect();
    return { left, right, width, height };
  });
  expect(bounds.width).toBeGreaterThanOrEqual(44);
  expect(bounds.height).toBeGreaterThanOrEqual(44);
  expect(bounds.left).toBeGreaterThanOrEqual(0);
  expect(bounds.right).toBeLessThanOrEqual(viewportWidth);
}

for (const width of [1440, 375]) {
  test(`Alice reads assigned open tasks and reaches their context at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/login");
    await page
      .getByRole("textbox", { name: "E-mail", exact: true })
      .fill("alice@example.com");
    await page.getByLabel("Mot de passe", { exact: true }).fill("P@ssword123");

    // Observe the authenticated request used by the page, without changing the seed.
    const assignedTasksResponse = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === "/dashboard/assigned-tasks" &&
        response.request().method() === "GET",
    );
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL("/");
    const response = await assignedTasksResponse;
    expect(response.ok()).toBe(true);
    const body: { success: boolean; data: { tasks: AssignedTask[] } } =
      await response.json();
    expect(body.success).toBe(true);
    const tasks = body.data.tasks;
    const openTasks = tasks.filter(
      (task) => task.status !== "DONE" && task.status !== "CANCELLED",
    );
    for (const task of tasks) {
      expect(task.assignees.map(({ user }) => user.email)).toContain(
        "alice@example.com",
      );
    }

    const dashboard = page.getByRole("main");
    await expect(
      dashboard.getByRole("heading", { level: 1, name: "Tableau de bord" }),
    ).toBeVisible();
    const assignedTasks = dashboard.getByRole("region", {
      name: "Mes tâches assignées",
      exact: true,
    });
    await expect(
      assignedTasks.getByRole("heading", {
        level: 2,
        name: "Mes tâches assignées",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      assignedTasks.getByText("Par ordre de priorité, puis d’échéance", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(dashboard.getByRole("tab")).toHaveCount(0);
    await expect(dashboard.getByRole("searchbox")).toHaveCount(0);
    await expect(dashboard.getByRole("button", { name: /Créer/ })).toHaveCount(
      0,
    );
    await expect(
      assignedTasks.getByText("Terminée", { exact: true }),
    ).toHaveCount(0);
    await expect(
      assignedTasks.getByText("Annulée", { exact: true }),
    ).toHaveCount(0);

    const list = assignedTasks.getByRole("list", {
      name: "Tâches assignées",
      exact: true,
    });
    const cards = list.getByRole("listitem");
    await expect(cards).toHaveCount(openTasks.length);
    const displayedTitles = await cards
      .getByRole("heading", { level: 3 })
      .allTextContents();
    const links = list.getByRole("link");
    const displayedHrefs = await links.evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("href")),
    );
    expect(displayedHrefs).toHaveLength(openTasks.length);

    for (const task of openTasks) {
      const href = `/projects/${task.project.id}#task-${task.id}`;
      expect(displayedHrefs).toContain(href);
      const card = cards.filter({
        has: page.getByRole("link", {
          name: `Voir la tâche « ${task.title} »`,
          exact: true,
        }),
      });
      await expect(card).toHaveCount(1);
      await expect(card.getByRole("heading", { level: 3 })).toHaveText(
        task.title,
      );
      await expect(
        card.getByText(task.description || "Aucune description.", {
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        card.getByText(statusLabels[task.status], { exact: true }),
      ).toBeVisible();
      const metadata = card.locator("dl > div");
      await expect(
        metadata
          .filter({ has: page.getByText("Projet", { exact: true }) })
          .locator("dd"),
      ).toHaveText(task.project.name);
      await expect(
        metadata
          .filter({ has: page.getByText("Commentaires", { exact: true }) })
          .locator("dd"),
      ).toHaveText(String(task.comments.length));
      if (task.dueDate) {
        const calendarDay = task.dueDate.slice(0, 10);
        await expect(card.locator("time")).toHaveAttribute(
          "datetime",
          calendarDay,
        );
        await expect(card.locator("time")).toHaveText(
          frenchCalendarDate.format(new Date(calendarDay)),
        );
      } else {
        await expect(
          card.getByText("Aucune échéance", { exact: true }),
        ).toBeVisible();
        await expect(card.locator("time")).toHaveCount(0);
      }
      const link = card.getByRole("link", {
        name: `Voir la tâche « ${task.title} »`,
        exact: true,
      });
      await expect(link).toHaveAttribute("href", href);
      await expectUsableTarget(link, width);
    }

    // These seed expectations are independent of the frontend sorting function.
    const videoTitle = "Lecteur vidéo personnalisé";
    const mediumTitles = [
      "Interface utilisateur responsive",
      "Système de quiz interactif",
    ];
    expect(displayedTitles).toEqual(
      expect.arrayContaining([videoTitle, ...mediumTitles]),
    );
    for (const title of mediumTitles) {
      expect(displayedTitles.indexOf(videoTitle)).toBeLessThan(
        displayedTitles.indexOf(title),
      );
    }
    const displayedTasks = displayedHrefs.map((href) => {
      const task = openTasks.find(
        (candidate) =>
          href === `/projects/${candidate.project.id}#task-${candidate.id}`,
      );
      if (!task) throw new Error(`Unexpected assigned task link: ${href}`);
      return task;
    });
    for (let index = 1; index < displayedTasks.length; index += 1) {
      const previous = displayedTasks[index - 1];
      const current = displayedTasks[index];
      expect(priorityRank[previous.priority]).toBeLessThanOrEqual(
        priorityRank[current.priority],
      );
      if (previous.priority === current.priority) {
        const previousDue = previous.dueDate
          ? Date.parse(previous.dueDate)
          : Infinity;
        const currentDue = current.dueDate
          ? Date.parse(current.dueDate)
          : Infinity;
        expect(previousDue).toBeLessThanOrEqual(currentDue);
        if (previousDue === currentDue) {
          expect(tasks.indexOf(previous)).toBeLessThan(tasks.indexOf(current));
        }
      }
    }

    const accountMenu = page.getByRole("button", { name: "Menu du compte" });
    await expectUsableTarget(accountMenu, width);
    await accountMenu.click();
    await expect(
      page.getByRole("menuitem", { name: "Mon compte", exact: true }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(accountMenu).toBeFocused();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    await page.screenshot({
      path: testInfo.outputPath(`dashboard-assigned-tasks-${width}.png`),
      fullPage: true,
    });

    const task = openTasks.find((candidate) => candidate.title === videoTitle);
    if (!task) throw new Error("The seeded assigned video task is missing");
    const viewLink = list.getByRole("link", {
      name: `Voir la tâche « ${task.title} »`,
      exact: true,
    });
    if (width === 1440) {
      await viewLink.focus();
      await expect(viewLink).toBeFocused();
      await page.keyboard.press("Enter");
    } else {
      await viewLink.click();
    }
    await expect(page).toHaveURL(
      `/projects/${task.project.id}#task-${task.id}`,
    );
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: task.project.name,
        exact: true,
      }),
    ).toBeVisible();
    const projectTask = page.locator(`#task-${task.id}`);
    await expect(projectTask).toHaveJSProperty("tagName", "LI");
    await expect(projectTask).toHaveAttribute("tabindex", "-1");
    await expect(projectTask).toBeFocused();
    await expect(projectTask).toBeVisible();
    await expect(projectTask).toBeInViewport();
    await expect(
      projectTask.getByRole("heading", {
        level: 3,
        name: task.title,
        exact: true,
      }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
  });
}
